import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { deletePost, updatePost } from "@/services/postService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    console.log("[DEBUG] PATCH post - no authenticated user");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  console.log("[DEBUG] PATCH post - user:", user._id.toString(), "post:", id);

  try {
    const body = await req.json();
    const { title, content, tags } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.length > 300) {
      return NextResponse.json({ error: "Title must be 300 characters or less" }, { status: 400 });
    }

    if (content && typeof content !== "string") {
      return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
    }

    if (tags && (!Array.isArray(tags) || !tags.every(tag => typeof tag === "string"))) {
      return NextResponse.json({ error: "Tags must be an array of strings" }, { status: 400 });
    }

    const updatedPost = await updatePost(id, user._id.toString(), {
      title: title.trim(),
      content: content?.trim() || "",
      tags: tags || [],
    });

    if (!updatedPost) {
      console.log("[DEBUG] PATCH post - post not found");
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.log("[DEBUG] PATCH post - success");
    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update post";
    console.log("[DEBUG] PATCH post - error:", message);
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
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
