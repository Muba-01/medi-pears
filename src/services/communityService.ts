import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Community, { ICommunity } from "@/models/Community";
import User from "@/models/User";
import { CreateCommunityInput } from "@/lib/validations";

export async function createCommunity(
  input: CreateCommunityInput,
  createdBy: string
): Promise<ICommunity> {
  await connectDB();
  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
  return Community.create({ ...input, slug, createdBy });
}

export async function getCommunityBySlug(
  slug: string
): Promise<ICommunity | null> {
  await connectDB();
  return Community.findOne({ slug: slug.toLowerCase() });
}

export async function getCommunities(): Promise<ICommunity[]> {
  await connectDB();
  return Community.find().sort({ membersCount: -1 }).limit(20).lean();
}

export async function incrementMembersCount(slug: string): Promise<void> {
  await connectDB();
  await Community.findOneAndUpdate({ slug }, { $inc: { membersCount: 1 } });
}

export async function communityExists(slug: string): Promise<boolean> {
  await connectDB();
  const count = await Community.countDocuments({ slug: slug.toLowerCase() });
  return count > 0;
}

export async function isUserJoined(slug: string, userId: string): Promise<boolean> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(userId)) return false;
  const community = await Community.findOne({ slug: slug.toLowerCase() }).select("_id").lean();
  if (!community) return false;
  const user = await User.findById(userId).select("joinedCommunities").lean();
  if (!user) return false;
  return (user.joinedCommunities ?? []).some((id) => id.toString() === community._id.toString());
}

/** Toggle join/leave. Returns the new joined state. */
export async function toggleJoinCommunity(
  slug: string,
  userId: string
): Promise<{ joined: boolean; membersCount: number }> {
  await connectDB();
  const community = await Community.findOne({ slug: slug.toLowerCase() });
  if (!community) throw new Error("Community not found");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const communityId = community._id;
  const alreadyJoined = (user.joinedCommunities ?? []).some(
    (id) => id.toString() === communityId.toString()
  );

  if (alreadyJoined) {
    // Leave
    await User.findByIdAndUpdate(userId, { $pull: { joinedCommunities: communityId } });
    const updated = await Community.findByIdAndUpdate(
      communityId,
      { $inc: { membersCount: -1 } },
      { new: true }
    );
    return { joined: false, membersCount: updated?.membersCount ?? community.membersCount - 1 };
  } else {
    // Join
    await User.findByIdAndUpdate(userId, { $addToSet: { joinedCommunities: communityId } });
    const updated = await Community.findByIdAndUpdate(
      communityId,
      { $inc: { membersCount: 1 } },
      { new: true }
    );
    return { joined: true, membersCount: updated?.membersCount ?? community.membersCount + 1 };
  }
}
