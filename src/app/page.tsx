import { Suspense } from "react";
import PostList from "@/components/posts/PostList";
import Sidebar from "@/components/layout/Sidebar";
import CreatePostButton from "@/components/forms/CreatePostButton";
import { getPosts } from "@/services/postService";
import type { Post } from "@/lib/types";

const VALID_SORTS = ["hot", "new", "top", "rising"] as const;
type Sort = (typeof VALID_SORTS)[number];

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { sort } = await searchParams;
  const sortBy: Sort = VALID_SORTS.includes(sort as Sort) ? (sort as Sort) : "hot";

  let posts: Post[] = [];
  try {
    posts = await getPosts({ sort: sortBy });
  } catch { /* DB not connected yet — show empty state */ }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div
            className="relative rounded-xl overflow-hidden mb-5 p-6"
            style={{
              background: "linear-gradient(135deg, #3b1f6e 0%, #1e3a8a 60%, #0f172a 100%)",
            }}>
            <div className="relative z-10">
              <h1 className="text-xl font-bold text-white mb-1">
                Welcome to Medipear
              </h1>
              <p className="text-sm text-white/60 mb-4">
                The decentralized community platform for Web3 builders and explorers.
              </p>
              <CreatePostButton />
            </div>
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
              style={{ background: "#7c3aed", transform: "translate(30%, -30%)" }}
            />
            <div
              className="absolute bottom-0 right-16 w-32 h-32 rounded-full blur-2xl opacity-15"
              style={{ background: "#2563eb", transform: "translateY(20%)" }}
            />
          </div>

          <Suspense>
            <PostList posts={posts} showSortBar />
          </Suspense>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
