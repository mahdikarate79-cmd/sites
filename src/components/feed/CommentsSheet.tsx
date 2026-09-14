"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { formatTimeAgo } from "@/lib/utils/format";
import { Comment } from "@/lib/types";
import { fetchComments, postComment } from "@/lib/api/comments";

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  initialCount: number;
  onCountChange?: (count: number) => void;
}

export function CommentsSheet({ open, onClose, postId, initialCount, onCountChange }: CommentsSheetProps) {
  const { getCurrentUser } = usePrototype();
  const { isAuthenticated } = useAuth();
  const { requireMiniApp } = useTelegramGate();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(initialCount);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!open) return;
    if (isAuthenticated) {
      fetchComments(postId)
        .then((comments) => {
          setLocalComments(comments);
          setCount(comments.length || initialCount);
        })
        .catch(() => setLocalComments([]));
    }
  }, [open, postId, isAuthenticated, initialCount]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localComments, open]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    if (!requireMiniApp()) return;

    const clientId = `pending_${Date.now()}`;
    const optimistic: Comment = {
      id: clientId,
      clientId,
      postId,
      authorId: user.id,
      authorName: user.displayName,
      authorAvatar: user.avatar,
      authorVerified: user.verified,
      authorPremium: user.premium,
      content,
      createdAt: new Date().toISOString(),
      sendStatus: "sending",
    };

    setSending(true);
    setText("");
    setLocalComments((prev) => [...prev, optimistic]);
    const nextCount = count + 1;
    setCount(nextCount);
    onCountChange?.(nextCount);

    try {
      const saved = await postComment(postId, content);
      setLocalComments((prev) => prev.map((c) => (c.clientId === clientId ? { ...saved, sendStatus: "sent" } : c)));
    } catch {
      setLocalComments((prev) => prev.filter((c) => c.clientId !== clientId));
      setCount((c) => Math.max(initialCount, c - 1));
      onCountChange?.(Math.max(initialCount, count - 1));
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Comments · ${count}`}>
      <div className="flex flex-col max-h-[70dvh]">
        <div className="flex-1 overflow-y-auto px-4 min-h-[200px] max-h-[50dvh]">
          {localComments.length === 0 && (
            <p className="text-center text-text-muted text-sm py-8">No comments yet</p>
          )}
          {localComments.map((c, i) => (
            <div key={c.id}>
              {i > 0 && (
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent backdrop-blur-sm" aria-hidden />
              )}
              <div className="flex gap-2.5 py-1">
                <ProfileLink user={{ id: c.authorId, username: c.authorUsername ?? undefined }} className="shrink-0 mt-0.5">
                  <Avatar src={c.authorAvatar} alt="" size="sm" />
                </ProfileLink>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <ProfileLink user={{ id: c.authorId, username: c.authorUsername ?? undefined }}>
                      <UserName
                        user={{ displayName: c.authorName, verified: c.authorVerified, premium: c.authorPremium }}
                        nameClassName="text-sm font-semibold"
                      />
                    </ProfileLink>
                    <span className="text-xs text-text-muted">{formatTimeAgo(c.createdAt)}</span>
                    {c.sendStatus === "sending" && <Loader2 className="w-3 h-3 animate-spin text-text-muted" />}
                  </div>
                  <p className="text-sm mt-0.5 leading-relaxed">{c.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-border px-4 py-3 flex items-center gap-2">
          <Avatar src={user.avatar} alt="" size="sm" className="shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 rounded-full bg-surface border border-border text-sm outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="p-2 rounded-full bg-[#3b82f6] text-white disabled:opacity-40 shrink-0"
            aria-label="Send comment"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
