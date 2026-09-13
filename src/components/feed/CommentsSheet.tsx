"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { formatTimeAgo } from "@/lib/utils/format";
import { Comment } from "@/lib/types";

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  initialCount: number;
  onCountChange?: (count: number) => void;
}

export function CommentsSheet({ open, onClose, postId, initialCount, onCountChange }: CommentsSheetProps) {
  const { getComments, getCommentCount, addComment, getCurrentUser } = usePrototype();
  const { requireMiniApp } = useTelegramGate();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    if (open) setLocalComments(getComments(postId));
  }, [open, postId, getComments]);

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
    onCountChange?.(getCommentCount(postId, initialCount) + 1);

    await new Promise((r) => setTimeout(r, 350));

    const saved = addComment(postId, content);
    setLocalComments((prev) => prev.map((c) => (c.clientId === clientId ? { ...saved, sendStatus: "sent" } : c)));
    setSending(false);
  };

  const count = getCommentCount(postId, initialCount);

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
                <Avatar src={c.authorAvatar} alt="" size="sm" className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <UserName
                      user={{ displayName: c.authorName, verified: c.authorVerified, premium: c.authorPremium }}
                      nameClassName="text-sm font-semibold"
                    />
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
