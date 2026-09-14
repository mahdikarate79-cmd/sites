import crypto from "crypto";
import { findUserById, findUserByUsername, publicUser } from "./db.mjs";
import { config } from "./config.mjs";
import { MIN_STARS_PAYMENT, isValidPaidStars } from "./constants.mjs";

function mediaUrl(m) {
  if (!m) return m;
  if (m.objectKey) {
    return { ...m, url: `${config.apiUrl}/api/media/${encodeURIComponent(m.objectKey)}` };
  }
  const url = String(m.url ?? "");
  if (url.startsWith("blob:") || url.startsWith("data:")) return { ...m, url: null };
  return m;
}

export function ensureSocial(db) {
  if (!db.follows) db.follows = {};
  if (!db.postLikes) db.postLikes = {};
  if (!db.donations) db.donations = {};
}

export function displayFollowers(user) {
  return (user.followers ?? 0) + (user.fakeFollowers ?? 0);
}

export function displayLikes(post) {
  return (post.likes ?? 0) + (post.fakeLikes ?? 0);
}

export function isFollowing(db, followerId, followingId) {
  return !!db.follows?.[`${followerId}:${followingId}`];
}

export function followUser(db, followerId, followingId) {
  ensureSocial(db);
  if (followerId === followingId) return { ok: false, error: "Cannot follow yourself" };
  const follower = findUserById(db, followerId);
  const following = findUserById(db, followingId);
  if (!follower || !following) return { ok: false, error: "User not found" };
  const key = `${followerId}:${followingId}`;
  if (db.follows[key]) return { ok: true, already: true };
  db.follows[key] = { followerId, followingId, at: new Date().toISOString() };
  follower.following = (follower.following ?? 0) + 1;
  following.followers = (following.followers ?? 0) + 1;
  return { ok: true };
}

export function unfollowUser(db, followerId, followingId) {
  ensureSocial(db);
  const key = `${followerId}:${followingId}`;
  if (!db.follows[key]) return { ok: true, already: true };
  delete db.follows[key];
  const follower = findUserById(db, followerId);
  const following = findUserById(db, followingId);
  if (follower) follower.following = Math.max(0, (follower.following ?? 1) - 1);
  if (following) following.followers = Math.max(0, (following.followers ?? 1) - 1);
  return { ok: true };
}

export function getFollowersList(db, userId) {
  ensureSocial(db);
  const ids = Object.values(db.follows)
    .filter((f) => f.followingId === userId)
    .map((f) => f.followerId);
  return ids.map((id) => findUserById(db, id)).filter(Boolean).map(publicUser);
}

export function getFollowingList(db, userId) {
  ensureSocial(db);
  const ids = Object.values(db.follows)
    .filter((f) => f.followerId === userId)
    .map((f) => f.followingId);
  return ids.map((id) => findUserById(db, id)).filter(Boolean).map(publicUser);
}

export function resolveProfileUser(db, usernameOrId) {
  const s = String(usernameOrId ?? "").trim().replace(/^@/, "");
  if (!s) return null;
  return findUserByUsername(db, s) ?? findUserById(db, s);
}

export function serializePost(db, post, viewerId = null) {
  const author = findUserById(db, post.authorId);
  if (!author) return null;
  const liked = viewerId ? !!db.postLikes?.[`${viewerId}:${post.id}`] : false;
  const donation = db.donations?.[post.id] ?? { total: post.stars ?? 0, topDonators: post.topDonators ?? [] };
  return {
    id: post.id,
    author: {
      ...publicUser(author),
      followers: displayFollowers(author),
    },
    content: post.content ?? "",
    media: post.mediaExpired
      ? post.media?.map((m) => ({ ...m, url: null, expired: true }))
      : post.media?.map((m) => mediaUrl(m)),
    tags: post.tags ?? [],
    paidStars: post.paidStars,
    privacy: post.privacy,
    createdAt: post.createdAt,
    likes: displayLikes(post),
    liked,
    comments: post.comments ?? 0,
    views: (post.views ?? 0) + (post.fakeViews ?? 0),
    shares: post.shares ?? 0,
    stars: donation.total ?? 0,
    topDonators: donation.topDonators ?? [],
    bookmarked: false,
  };
}

export function getFeedPosts(db, viewerId = null) {
  const posts = Object.values(db.posts ?? {})
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return posts.map((p) => serializePost(db, p, viewerId)).filter(Boolean);
}

export function getPostById(db, postId, viewerId = null) {
  const post = db.posts?.[postId];
  if (!post) return null;
  return serializePost(db, post, viewerId);
}

export function getPostsByAuthor(db, authorId, viewerId = null) {
  return Object.values(db.posts ?? {})
    .filter((p) => p.authorId === authorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((p) => serializePost(db, p, viewerId))
    .filter(Boolean);
}

function sanitizeMediaList(media) {
  return (media ?? [])
    .filter((m) => {
      const url = String(m?.url ?? "");
      if (url.startsWith("blob:") || url.startsWith("data:")) return false;
      return !!(url || m?.objectKey);
    })
    .map((m) => ({
      type: m.type ?? "image",
      url: m.url ?? null,
      thumbnail: m.thumbnail,
      objectKey: m.objectKey,
    }));
}

export function searchUsers(db, query, viewerId = null) {
  const q = String(query ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!q) return [];
  return Object.values(db.users ?? {})
    .filter((u) => !u.deleted && !u.banned)
    .filter((u) => u.id !== viewerId)
    .filter((u) =>
      (u.username ?? "").toLowerCase().includes(q)
      || (u.displayName ?? "").toLowerCase().includes(q)
    )
    .sort((a, b) => displayFollowers(b) - displayFollowers(a))
    .slice(0, 50)
    .map((u) => publicUser(u));
}

export function createPost(db, authorId, body) {
  ensureSocial(db);
  const author = findUserById(db, authorId);
  if (!author) return { ok: false, error: "User not found" };
  if (body.paidStars && !isValidPaidStars(body.paidStars)) {
    return { ok: false, error: `Minimum ${MIN_STARS_PAYMENT} stars required` };
  }
  const id = `p_${crypto.randomBytes(6).toString("hex")}`;
  const media = sanitizeMediaList(body.media);
  const post = {
    id,
    authorId,
    content: String(body.content ?? "").slice(0, 5000),
    media,
    tags: body.tags ?? [],
    paidStars: body.paidStars ? Math.max(MIN_STARS_PAYMENT, Number(body.paidStars)) : undefined,
    privacy: body.privacy,
    likes: 0,
    fakeLikes: 0,
    comments: 0,
    views: 0,
    shares: 0,
    stars: 0,
    topDonators: [],
    createdAt: new Date().toISOString(),
    mediaExpired: false,
  };
  db.posts[id] = post;
  author.postsCount = (author.postsCount ?? 0) + 1;
  return { ok: true, post: serializePost(db, post, authorId) };
}

export function incrementPostView(db, postId) {
  const post = db.posts?.[postId];
  if (!post) return null;
  post.views = (post.views ?? 0) + 1;
  return (post.views ?? 0) + (post.fakeViews ?? 0);
}

export function adjustPostStats(db, postId, { likesDelta = 0, viewsDelta = 0, fakeLikesDelta = 0, fakeViewsDelta = 0 }) {
  const post = db.posts?.[postId];
  if (!post) return { ok: false, error: "Post not found" };
  if (likesDelta) post.likes = Math.max(0, (post.likes ?? 0) + likesDelta);
  if (viewsDelta) post.views = Math.max(0, (post.views ?? 0) + viewsDelta);
  if (fakeLikesDelta) post.fakeLikes = Math.max(0, (post.fakeLikes ?? 0) + fakeLikesDelta);
  if (fakeViewsDelta) post.fakeViews = Math.max(0, (post.fakeViews ?? 0) + fakeViewsDelta);
  return {
    ok: true,
    likes: displayLikes(post),
    views: (post.views ?? 0) + (post.fakeViews ?? 0),
    realLikes: post.likes ?? 0,
    fakeLikes: post.fakeLikes ?? 0,
    realViews: post.views ?? 0,
    fakeViews: post.fakeViews ?? 0,
  };
}

export function togglePostLike(db, userId, postId) {
  ensureSocial(db);
  const post = db.posts?.[postId];
  if (!post) return { ok: false, error: "Post not found" };
  const key = `${userId}:${postId}`;
  const liked = !!db.postLikes[key];
  if (liked) {
    delete db.postLikes[key];
    post.likes = Math.max(0, (post.likes ?? 1) - 1);
  } else {
    db.postLikes[key] = { userId, postId, at: new Date().toISOString() };
    post.likes = (post.likes ?? 0) + 1;
  }
  return { ok: true, liked: !liked, likes: displayLikes(post) };
}

export function recordDonation(db, postId, donorId, stars, anonymous, donorUser) {
  ensureSocial(db);
  const post = db.posts?.[postId];
  if (!post) return;
  if (!db.donations[postId]) {
    db.donations[postId] = { total: 0, topDonators: [], userDonations: {} };
  }
  const d = db.donations[postId];
  d.total = (d.total ?? 0) + stars;
  post.stars = d.total;
  const donor = anonymous
    ? { id: "anon", username: "anonymous", displayName: "Anonymous", avatar: "", verified: false, premium: false }
    : {
        id: donorUser.id,
        username: donorUser.username,
        displayName: donorUser.displayName,
        avatar: donorUser.avatar,
        verified: donorUser.verified,
        premium: donorUser.premium,
      };
  const existing = d.topDonators.find((t) => t.user.id === donor.id);
  if (existing) {
    existing.stars += stars;
  } else {
    d.topDonators.push({ user: donor, stars });
  }
  d.topDonators.sort((a, b) => b.stars - a.stars);
  d.userDonations[donorId] = (d.userDonations[donorId] ?? 0) + stars;
}
