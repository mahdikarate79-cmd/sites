"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
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
    const link = `https://sheytoni.app/post/${post.id}`;
    await navigator.clipboard.writeText(link);
    showToast("🔗 لینک کپی شد");
    setOpen(false);
  };

  const handleInterested = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
    markInterested(post);
    showToast("❤️ به علاقه‌مندی‌ها اضافه شد");
    setOpen(false);
  };

  const handleNotInterested = () => {
    markNotInterested(post);
    hidePost(post.id);
    onHide?.();
    showToast("👎 پست کمتر نمایش داده می‌شود");
    setOpen(false);
  };

  const handleBlock = () => {
    blockUser(post.author.id);
    onHide?.();
    showToast("🚫 کاربر بلاک شد");
    setOpen(false);
  };

  const items = [
    { emoji: "❤️", label: "علاقه دارم", action: handleInterested },
    { emoji: "👎", label: "علاقه ندارم", action: handleNotInterested },
    { emoji: "🚨", label: "گزارش", action: () => { setReportOpen(true); setOpen(false); }, danger: true },
    { emoji: "🔗", label: "کپی لینک", action: copyLink },
    { emoji: "🚫", label: "بلاک کردن کاربر", action: handleBlock, danger: true },
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
          <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {items.map(({ emoji, label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-bg transition-colors text-right ${
                  danger ? "text-like" : ""
                }`}
              >
                <span>{emoji}</span>
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
