import { Post, PostPrivacy } from "@/lib/types";

/** Mock map: which users each author follows (for followingOnly checks). */
const AUTHOR_FOLLOWING: Record<string, string[]> = {
  u2: ["u1", "u3", "u5"],
  u3: ["u1", "u2"],
  u4: ["u1"],
  u5: ["u1", "u2", "u9"],
  u9: ["u1", "u5"],
};

export function isPostPaid(post: Post): boolean {
  return (post.paidStars ?? 0) > 0;
}

export function isPostPrivate(post: Post): boolean {
  const p = post.privacy;
  return !!p?.enabled && (!!p.followersOnly || !!p.followingOnly);
}

export function isPostRestricted(post: Post): boolean {
  return isPostPaid(post) || isPostPrivate(post);
}

export function shouldExcludeFromPublicDiscovery(post: Post): boolean {
  return isPostRestricted(post);
}

export function authorFollowsViewer(authorId: string, viewerId: string): boolean {
  return (AUTHOR_FOLLOWING[authorId] ?? []).includes(viewerId);
}

export interface PostAccessContext {
  viewerId: string;
  isFollowing: (authorId: string) => boolean;
  isUnlocked?: (postId: string) => boolean;
}

export function hasPrivateAccess(post: Post, ctx: PostAccessContext): boolean {
  if (!isPostPrivate(post)) return true;
  if (post.author.id === ctx.viewerId) return true;
  const p = post.privacy!;
  const viaFollowers = !!p.followersOnly && ctx.isFollowing(post.author.id);
  const viaFollowing = !!p.followingOnly && authorFollowsViewer(post.author.id, ctx.viewerId);
  if (p.followersOnly && p.followingOnly) return viaFollowers || viaFollowing;
  if (p.followersOnly) return viaFollowers;
  if (p.followingOnly) return viaFollowing;
  return true;
}

export function shouldShowInFeed(post: Post, ctx: PostAccessContext): boolean {
  if (post.author.id === ctx.viewerId) return true;
  if (!isPostRestricted(post)) return true;
  if (isPostPrivate(post) && !hasPrivateAccess(post, ctx)) return false;
  if (isPostRestricted(post)) return ctx.isFollowing(post.author.id) || hasPrivateAccess(post, ctx);
  return true;
}

export function canViewPostMedia(post: Post, ctx: PostAccessContext): boolean {
  if (post.author.id === ctx.viewerId) return true;
  if (isPostPrivate(post) && !hasPrivateAccess(post, ctx)) return false;
  if (isPostPaid(post) && !ctx.isUnlocked?.(post.id)) return false;
  return true;
}

/** @deprecated Use canViewPostMedia */
export function canViewPost(post: Post, ctx: PostAccessContext): boolean {
  return canViewPostMedia(post, ctx);
}

export function getPrivacyAccessMessage(post: Post): string {
  const p = post.privacy;
  if (!p?.enabled) return "This post is public.";
  if (p.followersOnly && p.followingOnly) {
    return "Only followers or accounts this creator follows can view this post.";
  }
  if (p.followersOnly) return "Only followers of this creator can view this post.";
  if (p.followingOnly) return "Only accounts this creator follows can view this post.";
  return "This post has restricted access.";
}

export function normalizeTags(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

export const UPLOAD_LIMIT_NORMAL = 10 * 1024 * 1024;
export const UPLOAD_LIMIT_PREMIUM = 1024 * 1024 * 1024;

export function getUploadLimitBytes(isPremium: boolean): number {
  return isPremium ? UPLOAD_LIMIT_PREMIUM : UPLOAD_LIMIT_NORMAL;
}

export function formatUploadLimit(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return "1 GB";
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
