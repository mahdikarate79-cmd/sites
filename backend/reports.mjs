import crypto from "crypto";
import { findUserById } from "./db.mjs";

export function ensureReports(db) {
  if (!db.reports) db.reports = {};
}

export function createReport(db, reporterId, body) {
  ensureReports(db);
  const id = `rp_${crypto.randomBytes(6).toString("hex")}`;
  const post = body.postId ? db.posts?.[body.postId] : null;
  const reportedUser = body.userId ? findUserById(db, body.userId) : null;
  const report = {
    id,
    reporterId,
    postId: body.postId ?? null,
    userId: body.userId ?? null,
    category: String(body.category ?? ""),
    subcategory: String(body.subcategory ?? ""),
    detail: String(body.detail ?? "").slice(0, 2000),
    postContent: post?.content ?? null,
    postMedia: post?.media ?? [],
    reportedUsername: reportedUser?.username ?? null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.reports[id] = report;
  return report;
}

export function listReports(db) {
  ensureReports(db);
  return Object.values(db.reports).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
