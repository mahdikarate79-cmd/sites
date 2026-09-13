import { Post } from "@/lib/types";
import { apiFetch } from "./fetch";
import { shouldExcludeFromPublicDiscovery } from "@/lib/utils/postAccess";

export async function getFeedPosts(): Promise<Post[]> {
  try {
    const data = await apiFetch<{ posts: Post[] }>("/api/feed");
    return data.posts ?? [];
  } catch {
    return [];
  }
}

export async function getPostById(id: string): Promise<Post | undefined> {
  try {
    const data = await apiFetch<{ post: Post }>(`/api/posts/${encodeURIComponent(id)}`);
    return data.post;
  } catch {
    return undefined;
  }
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  try {
    const data = await apiFetch<{ posts: Post[] }>(`/api/users/${encodeURIComponent(userId)}`);
    return data.posts ?? [];
  } catch {
    return [];
  }
}

export async function getPublicPosts(): Promise<Post[]> {
  const posts = await getFeedPosts();
  return posts.filter((p) => !shouldExcludeFromPublicDiscovery(p));
}

export async function searchPosts(query: string): Promise<Post[]> {
  const q = query.toLowerCase();
  const posts = await getPublicPosts();
  return posts.filter(
    (p) =>
      p.content.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.includes(q.replace(/^#/, "")))
  );
}
