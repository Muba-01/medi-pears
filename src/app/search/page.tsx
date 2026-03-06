import { Suspense } from "react";
import { Search } from "lucide-react";
import PostList from "@/components/posts/PostList";
import Sidebar from "@/components/layout/Sidebar";
import { getPosts } from "@/services/postService";
import type { Post } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let posts: Post[] = [];
  if (query.length > 0) {
    try {
      posts = await getPosts({ search: query, sort: "new", limit: 50 });
    } catch { /* DB not ready */ }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Search size={18} style={{ color: "var(--muted)" }} />
              <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {query ? `Search results for "${query}"` : "Search"}
              </h1>
            </div>
            {query && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {posts.length === 0
                  ? "No results found."
                  : `${posts.length} result${posts.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>

          {query.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <Search size={48} style={{ color: "var(--muted)" }} className="mb-4 opacity-40" />
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                Start your search
              </h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Type something in the search bar above to find posts.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <Search size={48} style={{ color: "var(--muted)" }} className="mb-4 opacity-40" />
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                No results for &ldquo;{query}&rdquo;
              </h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Try a different keyword or check your spelling.
              </p>
            </div>
          ) : (
            <Suspense>
              <PostList posts={posts} showSortBar={false} />
            </Suspense>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
