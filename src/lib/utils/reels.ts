import { Post, PostMedia } from "@/lib/types";

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

export function findReelIndex(items: ReelItem[], postId: string, mediaIndex = 0): number {
  return items.findIndex((item) => item.post.id === postId && item.mediaIndex === mediaIndex);
}
