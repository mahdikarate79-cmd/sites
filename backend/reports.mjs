import crypto from "crypto";
import { findUserById, publicUser } from "./db.mjs";
import { displayLikes } from "./social.mjs";
import { config } from "./config.mjs";

export function ensureReports(db) {
  if (!db.reports) db.reports = {};
}

function mediaUrl(m) {
  if (!m) return m;
  if (m.objectKey) {
    return { ...m, url: `${config.apiUrl}/api/media/${encodeURIComponent(m.objectKey)}` };
  }
  return m;
}

export function createReport(db, reporterId, body) {
  ensureReports(db);
  const id = `rp_${crypto.randomBytes(6).toString("hex")}`;
  const post = body.postId ? db.posts?.[body.postId] : null;
  const reportedUser = body.userId ? findUserById(db, body.userId) : null;
  const reporter = findUserById(db, reporterId);
  const postAuthor = post ? findUserById(db, post.authorId) : null;
  const report = {
    id,
    reporterId,
    reporterUsername: reporter?.username ?? null,
    reporterDisplayName: reporter?.displayName ?? null,
    postId: body.postId ?? null,
    userId: body.userId ?? null,
    category: String(body.category ?? ""),
    subcategory: String(body.subcategory ?? ""),
    detail: String(body.detail ?? "").slice(0, 2000),
    postContent: post?.content ?? null,
    postMedia: post?.media?.map(mediaUrl) ?? [],
    postCreatedAt: post?.createdAt ?? null,
    postLikes: post ? displayLikes(post) : 0,
    postViews: post ? (post.views ?? 0) + (post.fakeViews ?? 0) : 0,
    postShares: post?.shares ?? 0,
    postAuthor: postAuthor ? publicUser(postAuthor) : null,
    reportedUser: reportedUser ? publicUser(reportedUser) : null,
    reportedUsername: reportedUser?.username ?? null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.reports[id] = report;
  return report;
}

function enrichReport(db, report) {
  const post = report.postId ? db.posts?.[report.postId] : null;
  const postAuthor = post ? findUserById(db, post.authorId) : null;
  const reporter = findUserById(db, report.reporterId);
  const reportedUser = report.userId ? findUserById(db, report.userId) : null;
  return {
    ...report,
    reporterUsername: reporter?.username ?? report.reporterUsername ?? null,
    reporterDisplayName: reporter?.displayName ?? report.reporterDisplayName ?? null,
    postContent: post?.content ?? report.postContent ?? null,
    postMedia: post?.media?.map(mediaUrl) ?? report.postMedia ?? [],
    postCreatedAt: post?.createdAt ?? report.postCreatedAt ?? null,
    postLikes: post ? displayLikes(post) : (report.postLikes ?? 0),
    postViews: post ? (post.views ?? 0) + (post.fakeViews ?? 0) : (report.postViews ?? 0),
    postShares: post?.shares ?? report.postShares ?? 0,
    postAuthor: postAuthor ? publicUser(postAuthor) : (report.postAuthor ?? null),
    reportedUser: reportedUser ? publicUser(reportedUser) : (report.reportedUser ?? null),
    reportedUsername: reportedUser?.username ?? report.reportedUsername ?? null,
  };
}

export function listReports(db) {
  ensureReports(db);
  return Object.values(db.reports)
    .map((r) => enrichReport(db, r))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markReportReviewed(db, reportId) {
  ensureReports(db);
  const report = db.reports?.[reportId];
  if (!report) return { ok: false, error: "Report not found" };
  delete db.reports[reportId];
  return { ok: true };
}
