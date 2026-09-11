import { Post } from "@/lib/types";
import { mockPosts } from "@/data/mock/posts";

export async function getFeedPosts(): Promise<Post[]> {
  // TODO: GET /api/posts/feed
  return mockPosts;
}

export async function getPostById(id: string): Promise<Post | undefined> {
  // TODO: GET /api/posts/:id
  return mockPosts.find((p) => p.id === id);
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  // TODO: GET /api/users/:userId/posts
  return mockPosts.filter((p) => p.author.id === userId);
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likes: number }> {
  // TODO: POST /api/posts/:id/like
  const post = mockPosts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  return { liked: !!post.liked, likes: post.likes };
}

export async function toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
  // TODO: POST /api/posts/:id/bookmark
  const post = mockPosts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.bookmarked = !post.bookmarked;
  return { bookmarked: !!post.bookmarked };
}

export async function searchPosts(query: string): Promise<Post[]> {
  // TODO: GET /api/posts/search?q=
  const q = query.toLowerCase();
  return mockPosts.filter((p) => p.content.toLowerCase().includes(q));
}
