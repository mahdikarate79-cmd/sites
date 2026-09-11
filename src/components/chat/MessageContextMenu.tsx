"use client";

import { Reply, Forward, Copy, Pin, Trash2, Download } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface MessageContextMenuProps {
  open: boolean;
  message: ChatMessage | null;
  isMedia: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onPin: (scope: "me" | "both") => void;
  onDelete: () => void;
  onSave: () => void;
}

export function MessageContextMenu({
  open,
  message,
  isMedia,
  onClose,
  onReply,
  onForward,
  onCopy,
  onPin,
  onDelete,
  onSave,
}: MessageContextMenuProps) {
  if (!message) return null;

  const textActions = [
    { icon: Reply, label: "Reply", action: onReply },
    { icon: Forward, label: "Forward", action: onForward },
    { icon: Copy, label: "Copy", action: onCopy },
    { icon: Pin, label: "Pin for me", action: () => onPin("me") },
    { icon: Pin, label: "Pin for both", action: () => onPin("both") },
    { icon: Trash2, label: "Delete", action: onDelete, danger: true },
  ];

  const mediaActions = [
    { icon: Download, label: "Save", action: onSave },
    { icon: Copy, label: "Copy", action: onCopy },
    { icon: Pin, label: "Pin for me", action: () => onPin("me") },
    { icon: Pin, label: "Pin for both", action: () => onPin("both") },
    { icon: Trash2, label: "Delete", action: onDelete, danger: true },
  ];

  const actions = isMedia ? mediaActions : textActions;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        {actions.map(({ icon: Icon, label, action, danger }) => (
          <button
            key={label}
            onClick={() => {
              action();
              onClose();
            }}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3.5 text-sm hover:bg-surface/50 transition-colors",
              danger && "text-like"
            )}
          >
            <Icon className={cn("w-5 h-5", danger ? "text-like" : "text-text-muted")} />
            {label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
