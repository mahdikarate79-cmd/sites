import { Post, PostMedia } from "@/lib/types";
import { hasPrivateAccess, isPostPaid, isPostPrivate, PostAccessContext, shouldExcludeFromPublicDiscovery } from "@/lib/utils/postAccess";

export interface ReelItem {
  post: Post;
  media: PostMedia;
  mediaIndex: number;
}

export function buildReelItems(posts: Post[]): ReelItem[] {
  const items: ReelItem[] = [];
  for (const post of posts) {
    if (!post.media) continue;
    post.media.forEach((media, i) => {
      if (media.type === "video" || media.type === "image" || media.type === "gif") {
        items.push({ post, media, mediaIndex: i });
      }
    });
  }
  return items;
}

export function canIncludeInAccessibleReels(post: Post, ctx: PostAccessContext): boolean {
  if (!post.media?.length) return false;
  if (post.author.id === ctx.viewerId) return true;
  if (!shouldExcludeFromPublicDiscovery(post)) return true;
  if (isPostPrivate(post) && !hasPrivateAccess(post, ctx)) return false;
  if (isPostPaid(post) && !ctx.isUnlocked?.(post.id)) return false;
  return true;
}

export function buildAccessibleReelItems(posts: Post[], ctx: PostAccessContext): ReelItem[] {
  return buildReelItems(posts.filter((p) => canIncludeInAccessibleReels(p, ctx)));
}

export function findReelIndex(items: ReelItem[], postId: string, mediaIndex = 0): number {
  return items.findIndex((item) => item.post.id === postId && item.mediaIndex === mediaIndex);
}
