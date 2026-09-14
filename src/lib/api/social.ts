import { Post, User } from "@/lib/types";
import { apiFetch } from "./fetch";

export async function fetchFollowers(userId: string): Promise<User[]> {
  const data = await apiFetch<{ users: User[] }>(`/api/users/${encodeURIComponent(userId)}/followers`);
  return data.users ?? [];
}

export async function fetchFollowing(userId: string): Promise<User[]> {
  const data = await apiFetch<{ users: User[] }>(`/api/users/${encodeURIComponent(userId)}/following`);
  return data.users ?? [];
}

export async function followUserApi(userId: string, unfollow = false): Promise<void> {
  await apiFetch("/api/social/follow", {
    method: "POST",
    body: JSON.stringify({ userId, unfollow }),
  });
}

export async function fetchUserProfile(usernameOrId: string): Promise<{ user: User; posts: Post[]; following: boolean }> {
  return apiFetch(`/api/users/${encodeURIComponent(usernameOrId)}`);
}

export async function createPostApi(body: {
  content: string;
  media?: unknown[];
  tags?: string[];
  paidStars?: number;
  privacy?: unknown;
}): Promise<Post> {
  const data = await apiFetch<{ post: Post }>("/api/posts/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.post;
}

export async function toggleLikeApi(postId: string): Promise<{ liked: boolean; likes: number }> {
  return apiFetch(`/api/posts/${encodeURIComponent(postId)}/like`, { method: "POST" });
}

export async function searchUsers(query: string): Promise<User[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];
  const data = await apiFetch<{ users: User[] }>(`/api/users/search?q=${q}`);
  return data.users ?? [];
}

export async function fetchPaidMediaUnlocks(): Promise<string[]> {
  const data = await apiFetch<{ unlocks: string[] }>("/api/user/paid-media-unlocks");
  return data.unlocks ?? [];
}

export async function recordPostShare(postId: string): Promise<number> {
  const data = await apiFetch<{ shares: number }>(
    `/api/posts/${encodeURIComponent(postId)}/share`,
    { method: "POST" },
  );
  return data.shares;
}

export async function fetchPost(postId: string): Promise<Post> {
  const data = await apiFetch<{ post: Post }>(`/api/posts/${encodeURIComponent(postId)}`);
  return data.post;
}
