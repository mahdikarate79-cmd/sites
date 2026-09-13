import { Post } from "@/lib/types";
import { getApiBase } from "./base";
import { shouldExcludeFromPublicDiscovery } from "@/lib/utils/postAccess";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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
