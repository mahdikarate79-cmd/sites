"use client";

import { useState } from "react";
import { Send, Paperclip, Image as ImageIcon, Video, Film } from "lucide-react";
import { ChatMessage } from "@/lib/types";

interface ChatInputProps {
  onSend: (content: string, type?: "text" | "image" | "video" | "gif", extras?: Partial<ChatMessage>) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [preview, setPreview] = useState<{ type: string; url: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [paidStars, setPaidStars] = useState(0);

  const handleSend = () => {
    if (preview) {
      onSend(preview.url, preview.type as "image" | "video" | "gif", {
        caption,
        spoiler,
        paidStars: paidStars > 0 ? paidStars : undefined,
      });
      setPreview(null);
      setCaption("");
      setSpoiler(false);
      setPaidStars(0);
      return;
    }
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleAttach = (type: "image" | "video" | "gif") => {
    const urls = {
      image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      gif: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop",
    };
    setPreview({ type, url: urls[type] });
    setShowAttach(false);
  };

  return (
    <div className="border-t border-border glass-nav px-3 py-2 safe-bottom">
      {preview && (
        <div className="mb-2 p-2 rounded-xl bg-surface border border-border">
          <p className="text-xs text-text-muted mb-2">Preview</p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption..."
            className="w-full px-3 py-1.5 rounded-lg bg-bg border border-border text-sm mb-2 outline-none"
          />
          <div className="flex gap-3 text-xs mb-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
              Spoiler
            </label>
            <label className="flex items-center gap-1">
              Paid:
              <input
                type="number"
                value={paidStars}
                onChange={(e) => setPaidStars(Number(e.target.value))}
                className="w-16 px-1 py-0.5 rounded bg-bg border border-border"
                min={0}
              />
              ⭐
            </label>
          </div>
        </div>
      )}

      {showAttach && (
        <div className="flex gap-2 mb-2 px-1">
          <button onClick={() => handleAttach("image")} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-sm">
            <ImageIcon className="w-4 h-4" /> Photo
          </button>
          <button onClick={() => handleAttach("video")} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-sm">
            <Video className="w-4 h-4" /> Video
          </button>
          <button onClick={() => handleAttach("gif")} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-sm">
            <Film className="w-4 h-4" /> GIF
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => setShowAttach(!showAttach)} className="p-2 rounded-full hover:bg-surface/50 transition-colors shrink-0" aria-label="Attach">
          <Paperclip className="w-5 h-5 text-text-muted" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-surface/50 border border-border text-sm outline-none focus:border-text-muted/30 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() && !preview}
          className="p-2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white disabled:opacity-30 transition-opacity shrink-0"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
