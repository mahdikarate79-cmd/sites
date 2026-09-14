"use client";

import { useState } from "react";
import { MoreHorizontal, Heart, ThumbsDown, Flag, Link2, Ban, Bookmark, Pencil, Trash2 } from "lucide-react";
import { Post } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ReportModal } from "./ReportModal";
import { EditPostModal } from "./EditPostModal";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/components/ui/ToastProvider";
import { PremiumBurst } from "@/components/ui/PremiumParticles";
import { cn } from "@/lib/utils/cn";
import { getPostShareUrl } from "@/lib/utils/siteUrl";
import { deletePostApi } from "@/lib/api/social";

interface PostMenuProps {
  post: Post;
  isOwner?: boolean;
  onHide?: () => void;
  onDeleted?: () => void;
  onUpdated?: (post: Post) => void;
}

export function PostMenu({ post, isOwner: isOwnerProp, onHide, onDeleted, onUpdated }: PostMenuProps) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { markInterested, markNotInterested, blockUser, hidePost, toggleBookmark, isBookmarked } = usePrototype();
  const { user: authUser, isAuthenticated } = useAuth();
  const { getCurrentUser } = usePrototype();
  const { showToast } = useToast();

  const viewerId = authUser?.id ?? (isAuthenticated ? getCurrentUser().id : null);
  const isOwner = isOwnerProp ?? (!!viewerId && viewerId !== "guest" && post.author.id === viewerId);

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

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deletePostApi(post.id);
      hidePost(post.id);
      onHide?.();
      onDeleted?.();
      showToast("Post deleted");
      setOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not delete post");
    } finally {
      setDeleting(false);
    }
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

  const ownerItems = [
    { icon: Pencil, label: "Edit post", action: () => { setEditOpen(true); setOpen(false); } },
    { icon: Link2, label: "Copy link", action: copyLink },
    { icon: Link2, label: `Post ID: ${post.id}`, action: copyPostId },
    { icon: Trash2, label: deleting ? "Deleting…" : "Delete post", action: handleDelete, danger: true },
  ];

  const viewerItems = [
    { icon: Heart, label: "I like this", action: handleInterested },
    { icon: ThumbsDown, label: "I don't like this", action: handleNotInterested },
    { icon: Bookmark, label: isBookmarked(post.id) ? "Unsave" : "Save", action: () => { toggleBookmark(post.id); setOpen(false); } },
    { icon: Link2, label: "Copy link", action: copyLink },
    { icon: Link2, label: `Post ID: ${post.id}`, action: copyPostId },
    { icon: Flag, label: "Report", action: () => { setReportOpen(true); setOpen(false); }, danger: true },
    { icon: Ban, label: "Block user", action: handleBlock, danger: true },
  ];

  const items = isOwner ? ownerItems : viewerItems;

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
              disabled={deleting && label.startsWith("Delete")}
              className={cn("flex items-center gap-3 w-full px-4 py-3.5 text-sm hover:bg-surface/50 text-left", danger && "text-like")}
            >
              <Icon className={cn("w-5 h-5 shrink-0", danger ? "text-like" : "text-text-muted")} />
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>

      {!isOwner && (
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} postId={post.id} userId={post.author.id} />
      )}
      {isOwner && (
        <EditPostModal
          open={editOpen}
          post={post}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            onUpdated?.(updated);
            showToast("Post updated");
          }}
        />
      )}
    </>
  );
}
