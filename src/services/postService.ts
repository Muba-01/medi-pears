import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Community from "@/models/Community";
import { CreatePostInput } from "@/lib/validations";
import { Post as PostFE, User as UserFE, Community as CommunityFE } from "@/lib/types";

type PopulatedAuthor = {
  _id: mongoose.Types.ObjectId;
  username: string;
  walletAddress?: string;
  avatarUrl: string;
  karma: number;
  tokenBalance: number;
  bio: string;
  createdAt: Date;
};

type PopulatedCommunity = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  iconUrl: string;
  bannerUrl: string;
  createdAt: Date;
};

type LeanPost = {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: PopulatedAuthor;
  community: PopulatedCommunity;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  score: number;
  tags: string[];
  imageUrl?: string;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function serializeAuthor(a: PopulatedAuthor): UserFE {
  return {
    id: a._id.toString(),
    username: a.username,
    walletAddress: a.walletAddress ?? "",
    avatar: a.avatarUrl,
    karma: a.karma,
    tokensEarned: a.tokenBalance,
    joinDate: a.createdAt?.toISOString() ?? "",
    bio: a.bio,
    communities: [],
  };
}

function serializeCommunity(c: PopulatedCommunity): CommunityFE {
  return {
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description,
    memberCount: c.membersCount,
    postCount: 0,
    icon: c.iconUrl || "🌐",
    banner: c.bannerUrl,
    tags: [],
    createdAt: c.createdAt?.toISOString() ?? "",
    createdBy: "",
  };
}

function serializePost(p: LeanPost, currentUserId?: string): PostFE {
  const upvoteIds = p.upvotes.map((id) => id.toString());
  const downvoteIds = p.downvotes.map((id) => id.toString());

  let userVote: "up" | "down" | null = null;
  if (currentUserId) {
    if (upvoteIds.includes(currentUserId)) userVote = "up";
    else if (downvoteIds.includes(currentUserId)) userVote = "down";
  }

  return {
    id: p._id.toString(),
    title: p.title,
    content: p.content,
    authorId: p.author._id.toString(),
    author: serializeAuthor(p.author),
    communityId: p.community._id.toString(),
    community: serializeCommunity(p.community),
    upvotes: upvoteIds.length,
    downvotes: downvoteIds.length,
    commentCount: p.commentCount,
    tokenReward: 0,
    createdAt: p.createdAt.toISOString(),
    tags: p.tags,
    imageUrl: p.imageUrl,
    userVote,
  };
}

const POPULATE_AUTHOR = "username walletAddress avatarUrl karma tokenBalance bio createdAt";
const POPULATE_COMMUNITY = "name slug description membersCount iconUrl bannerUrl createdAt";

export type GetPostsFilter = {
  communitySlug?: string;
  authorWallet?: string;
  authorId?: string;
  sort?: "hot" | "new" | "top";
  limit?: number;
  page?: number;
};

export async function getPosts(
  filter: GetPostsFilter = {},
  currentUserId?: string
): Promise<PostFE[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filter.communitySlug) {
    const comm = await Community.findOne({
      slug: filter.communitySlug.toLowerCase(),
    }).lean();
    if (!comm) return [];
    query.community = comm._id;
  }

  if (filter.authorId && mongoose.Types.ObjectId.isValid(filter.authorId)) {
    query.author = new mongoose.Types.ObjectId(filter.authorId);
  }

  const sortMap: Record<string, Record<string, number>> = {
    new: { createdAt: -1 },
    top: { score: -1, createdAt: -1 },
    hot: { score: -1, createdAt: -1 },
  };
  const sortQuery = sortMap[filter.sort ?? "hot"];

  const raw = await Post.find(query)
    .populate<{ author: PopulatedAuthor }>("author", POPULATE_AUTHOR)
    .populate<{ community: PopulatedCommunity }>("community", POPULATE_COMMUNITY)
    .sort(sortQuery as Record<string, 1 | -1>)
    .limit(filter.limit ?? 50)
    .lean();

  let posts = (raw as unknown as LeanPost[]).map((p) =>
    serializePost(p, currentUserId)
  );

  if (filter.authorWallet) {
    const addr = filter.authorWallet.toLowerCase();
    posts = posts.filter((p) => p.author.walletAddress.toLowerCase() === addr);
  }

  return posts;
}

export async function getPostById(
  id: string,
  currentUserId?: string
): Promise<PostFE | null> {
  if (!process.env.MONGODB_URI) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();

  const raw = await Post.findById(id)
    .populate<{ author: PopulatedAuthor }>("author", POPULATE_AUTHOR)
    .populate<{ community: PopulatedCommunity }>("community", POPULATE_COMMUNITY)
    .lean();

  if (!raw) return null;
  return serializePost(raw as unknown as LeanPost, currentUserId);
}

export async function createPost(
  input: CreatePostInput,
  authorId: string
): Promise<PostFE> {
  await connectDB();

  const community = await Community.findOne({
    slug: input.communitySlug.toLowerCase(),
  }).lean();
  if (!community) throw new Error("Community not found");

  const created = await Post.create({
    title: input.title,
    content: input.content,
    author: authorId,
    community: community._id,
    tags: input.tags ?? [],
    imageUrl: input.imageUrl || undefined,
  });

  const populated = await Post.findById(created._id)
    .populate<{ author: PopulatedAuthor }>("author", POPULATE_AUTHOR)
    .populate<{ community: PopulatedCommunity }>("community", POPULATE_COMMUNITY)
    .lean();

  return serializePost(populated as unknown as LeanPost, authorId);
}

export async function votePost(
  postId: string,
  userId: string,
  voteType: "up" | "down"
): Promise<PostFE | null> {
  if (!mongoose.Types.ObjectId.isValid(postId)) return null;
  await connectDB();

  const userObjId = new mongoose.Types.ObjectId(userId);
  const post = await Post.findById(postId);
  if (!post) return null;

  const hasUpvoted = post.upvotes.some((id) => id.equals(userObjId));
  const hasDownvoted = post.downvotes.some((id) => id.equals(userObjId));

  if (voteType === "up") {
    if (hasUpvoted) {
      post.upvotes = post.upvotes.filter((id) => !id.equals(userObjId));
    } else {
      post.upvotes.push(userObjId);
      post.downvotes = post.downvotes.filter((id) => !id.equals(userObjId));
    }
  } else {
    if (hasDownvoted) {
      post.downvotes = post.downvotes.filter((id) => !id.equals(userObjId));
    } else {
      post.downvotes.push(userObjId);
      post.upvotes = post.upvotes.filter((id) => !id.equals(userObjId));
    }
  }

  post.score = post.upvotes.length - post.downvotes.length;
  await post.save();

  const populated = await Post.findById(post._id)
    .populate<{ author: PopulatedAuthor }>("author", POPULATE_AUTHOR)
    .populate<{ community: PopulatedCommunity }>("community", POPULATE_COMMUNITY)
    .lean();

  return serializePost(populated as unknown as LeanPost, userId);
}
