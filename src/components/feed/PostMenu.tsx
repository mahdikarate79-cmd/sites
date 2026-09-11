"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Heart, ThumbsDown, Flag, Link2, Ban } from "lucide-react";
import { Post } from "@/lib/types";
import { ReportModal } from "./ReportModal";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { PremiumBurst } from "@/components/ui/PremiumParticles";

interface PostMenuProps {
  post: Post;
  onHide?: () => void;
}

export function PostMenu({ post, onHide }: PostMenuProps) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { markInterested, markNotInterested, blockUser, hidePost } = usePrototype();
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://sheytoni.app/post/${post.id}`);
    showToast("Link copied");
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
    onHide?.();
    showToast("User blocked");
    setOpen(false);
  };

  const items = [
    { icon: Heart, label: "Interested", action: handleInterested },
    { icon: ThumbsDown, label: "Not interested", action: handleNotInterested },
    { icon: Flag, label: "Report", action: () => { setReportOpen(true); setOpen(false); }, danger: true },
    { icon: Link2, label: "Copy link", action: copyLink },
    { icon: Ban, label: "Block user", action: handleBlock, danger: true },
  ];

  return (
    <>
      <PremiumBurst active={burst} />
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-full hover:bg-surface transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4 text-text-muted" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {items.map(({ icon: Icon, label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-bg transition-colors text-left ${
                  danger ? "text-like" : ""
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${danger ? "text-like" : "text-text-muted"}`} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
