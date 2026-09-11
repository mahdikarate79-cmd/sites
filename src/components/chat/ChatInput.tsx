"use client";

import { useRef, useState } from "react";
import { Send, Paperclip, Image as ImageIcon, Video } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string, type?: "text" | "image" | "video") => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImage = () => {
    // Mock: In production, upload to R2 first then send object key
    onSend("https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop", "image");
    setShowAttach(false);
  };

  const handleVideo = () => {
    onSend("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "video");
    setShowAttach(false);
  };

  return (
    <div className="border-t border-border bg-bg px-3 py-2 safe-bottom">
      {showAttach && (
        <div className="flex gap-2 mb-2 px-1">
          <button onClick={handleImage} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-sm">
            <ImageIcon className="w-4 h-4" /> Photo
          </button>
          <button onClick={handleVideo} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-sm">
            <Video className="w-4 h-4" /> Video
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAttach(!showAttach)}
          className="p-2 rounded-full hover:bg-surface transition-colors shrink-0"
          aria-label="Attach"
        >
          <Paperclip className="w-5 h-5 text-text-muted" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-surface border border-border text-sm outline-none focus:border-text-muted transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-full bg-text text-bg disabled:opacity-30 transition-opacity shrink-0"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
