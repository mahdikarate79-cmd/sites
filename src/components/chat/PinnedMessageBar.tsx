"use client";

import { Pin } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface PinnedMessageBarProps {
  message: ChatMessage;
  scope: "me" | "both";
  onClick: () => void;
  onUnpin: () => void;
}

function previewText(msg: ChatMessage): string {
  if (msg.type === "image") return "Photo";
  if (msg.type === "video") return "Video";
  if (msg.type === "gif") return "GIF";
  return msg.content;
}

export function PinnedMessageBar({ message, scope, onClick, onUnpin }: PinnedMessageBarProps) {
  return (
    <div className="mx-3 mt-2">
      <button
        onClick={onClick}
        className="w-full glass-nav rounded-xl px-3 py-2 flex items-center gap-2.5 text-left hover:bg-surface/40 transition-colors"
      >
        <Pin className="w-4 h-4 text-[#8b5cf6] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#8b5cf6] font-medium">
            {scope === "both" ? "Pinned for both" : "Pinned by me"}
          </p>
          <p className="text-sm truncate text-text">{previewText(message)}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpin();
          }}
          className={cn(
            "text-[11px] text-text-muted px-2 py-1 rounded-lg hover:bg-surface/60 shrink-0"
          )}
        >
          Unpin
        </button>
      </button>
    </div>
  );
}
