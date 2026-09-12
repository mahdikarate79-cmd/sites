import { Post } from "@/lib/types";
import { mockPosts } from "@/data/mock/posts";
import { loadState } from "@/lib/store/prototypeStore";
import { shouldExcludeFromPublicDiscovery } from "@/lib/utils/postAccess";

function allPosts(): Post[] {
  if (typeof window === "undefined") return mockPosts;
  const state = loadState();
  return [...(state.userPosts ?? []), ...mockPosts];
}

export async function getFeedPosts(): Promise<Post[]> {
  return allPosts();
}

export async function getPostById(id: string): Promise<Post | undefined> {
  return allPosts().find((p) => p.id === id);
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  return allPosts().filter((p) => p.author.id === userId);
}

export async function getPublicPosts(): Promise<Post[]> {
  return allPosts().filter((p) => !shouldExcludeFromPublicDiscovery(p));
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likes: number }> {
  const post = allPosts().find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  return { liked: !!post.liked, likes: post.likes };
}

export async function toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
  const post = allPosts().find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.bookmarked = !post.bookmarked;
  return { bookmarked: !!post.bookmarked };
}

export async function searchPosts(query: string): Promise<Post[]> {
  const q = query.toLowerCase();
  return allPosts().filter(
    (p) =>
      !shouldExcludeFromPublicDiscovery(p) &&
      (p.content.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.includes(q.replace(/^#/, ""))))
  );
}
