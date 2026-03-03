import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import PostCard from "@/components/posts/PostCard";
import { getPostById } from "@/services/postService";
import { MessageSquare } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  let post = null;
  try {
    post = await getPostById(id);
  } catch { /* DB not ready */ }

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div
              className="rounded-xl border flex flex-col items-center justify-center py-24 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-4xl mb-4">🌑</p>
              <h1 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>
                Post not found
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                This post may have been removed or does not exist.
              </p>
              <Link
                href="/"
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--accent)" }}>
                Back to Home
              </Link>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Full post */}
          <PostCard post={post} />

          {/* Full content block (shown below card) */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>
              {post.title}
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
              {post.content}
            </p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post image"
                className="mt-4 rounded-lg max-w-full"
                style={{ maxHeight: "480px", objectFit: "cover" }}
              />
            )}
          </div>

          {/* Comments section */}
          <div
            className="rounded-xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div
              className="px-5 py-3 border-b flex items-center gap-2"
              style={{ borderColor: "var(--border)" }}>
              <MessageSquare size={15} style={{ color: "var(--muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {post.commentCount} Comment{post.commentCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="px-5 py-10 flex flex-col items-center text-center">
              <MessageSquare size={32} style={{ color: "var(--muted)" }} className="mb-3 opacity-40" />
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                No comments yet
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Be the first to share your thoughts.
              </p>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
