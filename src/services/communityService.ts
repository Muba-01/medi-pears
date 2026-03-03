import { connectDB } from "@/lib/db";
import Community, { ICommunity } from "@/models/Community";
import { CreateCommunityInput } from "@/lib/validations";

export async function createCommunity(
  input: CreateCommunityInput,
  createdBy: string
): Promise<ICommunity> {
  await connectDB();
  const slug = input.name.toLowerCase().replace(/\s+/g, "-");
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
