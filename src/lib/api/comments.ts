import { Comment } from "@/lib/types";
import { apiFetch } from "./fetch";

export async function fetchComments(postId: string): Promise<Comment[]> {
  const data = await apiFetch<{ comments: Comment[] }>(
    `/api/posts/${encodeURIComponent(postId)}/comments`,
  );
  return data.comments ?? [];
}

export async function postComment(postId: string, content: string): Promise<Comment> {
  const data = await apiFetch<{ comment: Comment }>(
    `/api/posts/${encodeURIComponent(postId)}/comments`,
    { method: "POST", body: JSON.stringify({ content }) },
  );
  return data.comment;
}

export async function recordPostView(postId: string): Promise<number> {
  const data = await apiFetch<{ views: number }>(
    `/api/posts/${encodeURIComponent(postId)}/view`,
    { method: "POST" },
  );
  return data.views;
}
