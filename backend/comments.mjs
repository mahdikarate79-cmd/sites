import crypto from "crypto";
import { findUserById, findDeletedUserById, publicUser } from "./db.mjs";

export function ensureComments(db) {
  if (!db.comments) db.comments = {};
}

export function getPostComments(db, postId) {
  ensureComments(db);
  return Object.values(db.comments)
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((c) => serializeComment(db, c));
}

export function createComment(db, postId, userId, content) {
  ensureComments(db);
  const post = db.posts?.[postId];
  if (!post) return { ok: false, error: "Post not found" };
  const author = findUserById(db, userId);
  if (!author) return { ok: false, error: "Unauthorized" };

  const text = String(content ?? "").trim().slice(0, 2000);
  if (!text) return { ok: false, error: "Empty comment" };

  const id = `c_${crypto.randomBytes(6).toString("hex")}`;
  const comment = {
    id,
    postId,
    authorId: userId,
    content: text,
    createdAt: new Date().toISOString(),
  };
  db.comments[id] = comment;
  post.comments = (post.comments ?? 0) + 1;
  return { ok: true, comment: serializeComment(db, comment) };
}

function serializeComment(db, comment) {
  const author = findUserById(db, comment.authorId) ?? findDeletedUserById(db, comment.authorId);
  const pub = publicUser(author);
  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    authorName: pub?.displayName ?? "User",
    authorUsername: pub?.username ?? null,
    authorAvatar: pub?.avatar ?? "",
    authorVerified: pub?.verified ?? false,
    authorPremium: pub?.premium ?? false,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}
