import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { votePost } from "@/services/postService";
import { VoteSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vote type. Must be 'up' or 'down'." },
      { status: 422 }
    );
  }

  const updated = await votePost(id, user._id.toString(), parsed.data.voteType);
  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: updated });
}
