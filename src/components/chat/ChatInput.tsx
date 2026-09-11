"use client";

import { useRef, useState } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { MediaGalleryPicker, SelectedMedia } from "./MediaGalleryPicker";

interface ChatInputProps {
  onSend: (content: string, type?: "text" | "image" | "video" | "gif", extras?: Partial<ChatMessage>) => void;
  onSendAlbum: (items: SelectedMedia[], caption: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  onSend,
  onSendAlbum,
  disabled,
  disabledMessage,
  replyTo,
  onCancelReply,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const handleSend = async () => {
    if (disabled || sendingRef.current || !text.trim()) return;
    sendingRef.current = true;
    setSending(true);
    try {
      await onSend(text.trim(), "text", replyTo ? { replyTo: replyTo.id } : undefined);
      setText("");
      onCancelReply?.();
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleGallerySend = async (items: SelectedMedia[], caption: string) => {
    if (disabled || sendingRef.current || items.length === 0) return;
    sendingRef.current = true;
    setSending(true);
    try {
      await onSendAlbum(items, caption);
      onCancelReply?.();
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const replyPreview = replyTo
    ? replyTo.type === "text"
      ? replyTo.content
      : replyTo.type === "album"
        ? "Media"
        : replyTo.type === "image"
          ? "Photo"
          : replyTo.type === "video"
            ? "Video"
            : "GIF"
    : "";

  return (
    <div className="border-t border-border glass-nav px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-surface/60 border-l-2 border-[#8b5cf6]">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#8b5cf6] font-medium">Reply</p>
            <p className="text-xs truncate text-text-muted">{replyPreview}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-surface" aria-label="Cancel reply">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      )}

      {disabled && disabledMessage && (
        <p className="text-xs text-text-muted text-center mb-2">{disabledMessage}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setGalleryOpen(true)}
          disabled={disabled || sending}
          className="p-2 rounded-full hover:bg-surface/50 transition-colors shrink-0 disabled:opacity-40"
          aria-label="Gallery"
        >
          <ImageIcon className="w-5 h-5 text-text-muted" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={disabled ? "Messaging disabled" : "Message..."}
          disabled={disabled || sending}
          className="flex-1 px-4 py-2.5 rounded-full bg-surface/50 border border-border text-sm outline-none focus:border-text-muted/30 transition-colors disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || sending || !text.trim()}
          className="p-2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white disabled:opacity-30 transition-opacity shrink-0"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <MediaGalleryPicker open={galleryOpen} onClose={() => setGalleryOpen(false)} onSend={handleGallerySend} />
    </div>
  );
}
