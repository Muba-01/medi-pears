import { NextRequest, NextResponse } from "next/server";
import { searchCommunities } from "@/services/communityService";
import { getPosts } from "@/services/postService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Get communities matching the query (limit to 3)
    const communities = await searchCommunities(query, 3);

    let suggestions: any[] = [];

    if (communities.length > 0) {
      // If we found communities, prioritize showing community posts
      const communityPostsPromises = communities.map(async (community) => {
        const communityPosts = await getPosts({
          communitySlug: community.slug,
          sort: "hot",
          limit: 3
        });
        return communityPosts.map(post => ({
          type: 'post',
          ...post,
          _fromCommunity: community.slug, // Indicate which community this post is from
        }));
      });

      const communityPostsArrays = await Promise.all(communityPostsPromises);
      const communityPosts = communityPostsArrays.flat();

      // Add communities first
      suggestions.push(...communities.map(community => ({
        type: 'community',
        ...community,
      })));

      // Add posts from matching communities (limit to 6 total)
      const uniqueCommunityPosts = communityPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.id === post.id)
      ).slice(0, 6);

      suggestions.push(...uniqueCommunityPosts);

    } else {
      // If no communities found, show general search results
      const posts = await getPosts({ search: query, sort: "hot", limit: 6 });
      suggestions.push(...posts.map(post => ({ type: 'post', ...post })));
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json([]);
  }
}