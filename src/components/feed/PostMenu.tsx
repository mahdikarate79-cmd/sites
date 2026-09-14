"use client";

import { useState } from "react";
import { MoreHorizontal, Heart, ThumbsDown, Flag, Link2, Ban, Bookmark } from "lucide-react";
import { Post } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ReportModal } from "./ReportModal";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { PremiumBurst } from "@/components/ui/PremiumParticles";
import { cn } from "@/lib/utils/cn";
import { getPostShareUrl } from "@/lib/utils/siteUrl";

interface PostMenuProps {
  post: Post;
  onHide?: () => void;
}

export function PostMenu({ post, onHide }: PostMenuProps) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const { markInterested, markNotInterested, blockUser, hidePost, toggleBookmark, isBookmarked } = usePrototype();
  const { showToast } = useToast();

  const copyLink = async () => {
    await navigator.clipboard.writeText(getPostShareUrl(post.id));
    showToast("Link copied");
    setOpen(false);
  };

  const copyPostId = async () => {
    await navigator.clipboard.writeText(post.id);
    showToast(`Post ID copied: ${post.id}`);
    setOpen(false);
  };

  const handleInterested = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
    markInterested(post);
    showToast("Added to interests");
    setOpen(false);
  };

  const handleNotInterested = () => {
    markNotInterested(post);
    hidePost(post.id);
    onHide?.();
    showToast("You'll see fewer posts like this");
    setOpen(false);
  };

  const handleBlock = () => {
    blockUser(post.author.id);
    showToast("User blocked");
    setOpen(false);
  };

  const items = [
    { icon: Heart, label: "I like this", action: handleInterested },
    { icon: ThumbsDown, label: "I don't like this", action: handleNotInterested },
    { icon: Bookmark, label: isBookmarked(post.id) ? "Unsave" : "Save", action: () => { toggleBookmark(post.id); setOpen(false); } },
    { icon: Link2, label: "Copy link", action: copyLink },
    { icon: Link2, label: `Post ID: ${post.id}`, action: copyPostId },
    { icon: Flag, label: "Report", action: () => { setReportOpen(true); setOpen(false); }, danger: true },
    { icon: Ban, label: "Block user", action: handleBlock, danger: true },
  ];

  return (
    <>
      <PremiumBurst active={burst} />
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-full hover:bg-surface transition-colors"
        aria-label="More options"
      >
        <MoreHorizontal className="w-4 h-4 text-text-muted" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="pb-4">
          {items.map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              onClick={action}
              className={cn("flex items-center gap-3 w-full px-4 py-3.5 text-sm hover:bg-surface/50 text-left", danger && "text-like")}
            >
              <Icon className={cn("w-5 h-5 shrink-0", danger ? "text-like" : "text-text-muted")} />
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} postId={post.id} userId={post.author.id} />
    </>
  );
}
