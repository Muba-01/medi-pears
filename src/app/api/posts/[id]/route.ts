import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { deletePost } from "@/services/postService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    console.log("[DEBUG] DELETE post - no authenticated user");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  console.log("[DEBUG] DELETE post - user:", user._id.toString(), "post:", id);

  try {
    const success = await deletePost(id, user._id.toString());
    if (!success) {
      console.log("[DEBUG] DELETE post - post not found");
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    console.log("[DEBUG] DELETE post - success");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete post";
    console.log("[DEBUG] DELETE post - error:", message);
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
