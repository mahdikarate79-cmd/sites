"use client";

import { Lock, Shield } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";
import { Post } from "@/lib/types";
import { getPrivacyAccessMessage, isPostPaid, isPostPrivate } from "@/lib/utils/postAccess";

interface PostAccessModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
  variant: "paid" | "private";
  onUnlock?: () => void;
}

export function PostAccessModal({ open, onClose, post, variant, onUnlock }: PostAccessModalProps) {
  const isPaid = variant === "paid" && isPostPaid(post);
  const isPrivate = variant === "private" && isPostPrivate(post);

  return (
    <BottomSheet open={open} onClose={onClose} title={isPaid ? "Paid content" : "Private post"}>
      <div className="px-5 pb-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl glass-nav flex items-center justify-center mb-4">
          {isPaid ? <TelegramStarIcon variant="post" size={28} /> : <Lock className="w-6 h-6 text-text-muted" />}
        </div>

        {isPaid && post.paidStars && (
          <p className="text-lg font-semibold text-white tabular-nums mb-2">
            {formatStars(post.paidStars)} Stars
          </p>
        )}

        <p className="text-sm text-text-muted leading-relaxed mb-5">
          {isPaid
            ? "Unlock this media to view the full content. Stars go directly to the creator."
            : getPrivacyAccessMessage(post)}
        </p>

        {isPrivate && (
          <div className="flex items-start gap-2 text-left glass-nav rounded-2xl px-4 py-3 mb-5">
            <Shield className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              Private posts are hidden from search and public reels. They appear only on the creator&apos;s profile and in home feeds for eligible viewers.
            </p>
          </div>
        )}

        {isPaid && onUnlock ? (
          <button
            type="button"
            onClick={onUnlock}
            className="w-full py-3 rounded-full bg-[#3b82f6] text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            Unlock for
            <TelegramStarIcon variant="donate" size={16} />
            <span className="tabular-nums">{formatStars(post.paidStars ?? 0)}</span>
          </button>
        ) : (
          <button type="button" onClick={onClose} className="w-full py-3 rounded-full glass-nav text-sm font-medium">
            Got it
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
