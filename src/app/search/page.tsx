import { Suspense } from "react";
import { Search } from "lucide-react";
import PostList from "@/components/posts/PostList";
import Sidebar from "@/components/layout/Sidebar";
import { getPosts } from "@/services/postService";
import { searchCommunities } from "@/services/communityService";
import type { Post } from "@/lib/types";
import type { ICommunity } from "@/models/Community";
import Link from "next/link";
import { formatNumber, timeAgo } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, sort: sortParam } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = sortParam === "new" || sortParam === "top" || sortParam === "rising" ? sortParam : "hot";

  let communities: ICommunity[] = [];
  let posts: Post[] = [];
  if (query.length > 0) {
    try {
      communities = await searchCommunities(query, 5);
      posts = await getPosts({ search: query, sort, limit: 50 });
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
                {communities.length + posts.length === 0
                  ? "No results found."
                  : `${communities.length + posts.length} result${communities.length + posts.length !== 1 ? "s" : ""}`}
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
                Type something in the search bar above to find communities and posts.
              </p>
            </div>
          ) : communities.length === 0 && posts.length === 0 ? (
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
            <div className="space-y-6">
              {/* Communities Section */}
              {communities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                    Communities
                  </h2>
                  <div className="space-y-2">
                    {communities.map((community) => (
                      <Link
                        key={community._id.toString()}
                        href={`/p/${community.slug}`}
                        className="block p-3 rounded-lg border hover:border-purple-500/40 transition-all"
                        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{community.iconUrl || "🍐"}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate" style={{ color: "var(--foreground)" }}>
                              🍐/{community.slug}
                            </h3>
                            <p className="text-sm truncate" style={{ color: "var(--muted)" }}>
                              {community.description || "No description"}
                            </p>
                          </div>
                          <div className="text-sm" style={{ color: "var(--muted)" }}>
                            {formatNumber(community.membersCount)} members
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Section */}
              {posts.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                    Posts
                  </h2>
                  <PostList posts={posts} showSortBar={true} />
                </div>
              )}
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
