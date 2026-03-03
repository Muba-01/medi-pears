import ProfileHeader from "@/components/profile/ProfileHeader";
import PostList from "@/components/posts/PostList";
import Sidebar from "@/components/layout/Sidebar";
import { getPosts } from "@/services/postService";
import { getUserByWallet, getUserById } from "@/services/userService";
import type { Post } from "@/lib/types";

interface PageProps {
  params: Promise<{ wallet: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { wallet } = await params;

  let posts: Post[] = [];
  let user = null;
  try {
    // slug may be a wallet address (0x...) or a MongoDB ObjectId (Google users)
    const isWalletAddress = /^0x[0-9a-fA-F]{40}$/i.test(wallet);
    user = isWalletAddress ? await getUserByWallet(wallet) : await getUserById(wallet);
    posts = await getPosts(
      isWalletAddress
        ? { authorWallet: wallet }
        : { authorId: wallet }
    );
  } catch { /* DB not ready */ }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <ProfileHeader
            walletAddress={user?.walletAddress ?? (wallet.startsWith("0x") ? wallet : undefined)}
            username={user?.username ?? null}
            avatarUrl={user?.avatarUrl ?? null}
            karma={user?.karma ?? 0}
            joinDate={user?.createdAt?.toISOString() ?? null}
            bio={user?.bio ?? ""}
          />
          <PostList posts={posts} />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
