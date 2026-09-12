"use client";

import { useState } from "react";
import { Heart, MessageCircle, Eye, Share2, Bookmark } from "lucide-react";
import { Post } from "@/lib/types";
import { formatCount } from "@/lib/utils/format";
import { DonateButton } from "@/components/ui/DonateButton";
import { ShareChatPicker } from "@/components/chat/ShareChatPicker";
import { CommentsSheet } from "./CommentsSheet";
import { cn } from "@/lib/utils/cn";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";

interface PostActionsProps {
  post: Post;
  onDonate: () => void;
}

export function PostActions({ post, onDonate }: PostActionsProps) {
  const { isLiked, isBookmarked, toggleLike, toggleBookmark, getDonation, getCommentCount } = usePrototype();
  const { showToast } = useToast();
  const liked = isLiked(post.id);
  const bookmarked = isBookmarked(post.id);
  const donation = getDonation(post.id, {
    total: post.stars ?? 0,
    topDonators: post.topDonators ?? [],
  });
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(getCommentCount(post.id, post.comments));
  const [animating, setAnimating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleLike = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);
    const nowLiked = toggleLike(post.id);
    setLikes(nowLiked ? likes + 1 : likes - 1);
  };

  const handleShare = (chatIds: string[]) => {
    showToast(`Shared to ${chatIds.length} chat${chatIds.length > 1 ? "s" : ""}`);
  };

  return (
    <>
      <div className="flex items-center justify-between mt-3 -ml-1">
        <div className="flex items-center gap-0.5">
          <DonateButton total={donation.total} donated={donation.userDonated} onClick={onDonate} />

          <button onClick={handleLike} className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors" aria-label={liked ? "Unlike" : "Like"}>
            <Heart className={cn("w-[18px] h-[18px] transition-colors", liked ? "text-like fill-like" : "text-text-muted", animating && "animate-like")} />
            {likes > 0 && <span className="text-xs text-text-muted">{formatCount(likes)}</span>}
          </button>

          <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors" aria-label="Comments">
            <MessageCircle className="w-[18px] h-[18px] text-text-muted" />
            {comments > 0 && <span className="text-xs text-text-muted">{formatCount(comments)}</span>}
          </button>

          <button className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors" aria-label="Views">
            <Eye className="w-[18px] h-[18px] text-text-muted" />
            {post.views > 0 && <span className="text-xs text-text-muted">{formatCount(post.views)}</span>}
          </button>

          <button onClick={() => setShareOpen(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors" aria-label="Share">
            <Share2 className="w-[18px] h-[18px] text-text-muted" />
          </button>
        </div>

        <button onClick={() => toggleBookmark(post.id)} className="p-1.5 rounded-full hover:bg-surface transition-colors" aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}>
          <Bookmark className={cn("w-[18px] h-[18px]", bookmarked ? "text-text fill-text" : "text-text-muted")} />
        </button>
      </div>

      <ShareChatPicker open={shareOpen} onClose={() => setShareOpen(false)} title="Share to" onSend={handleShare} />
      <CommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        initialCount={post.comments}
        onCountChange={setComments}
      />
    </>
  );
}
