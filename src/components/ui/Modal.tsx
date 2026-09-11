"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { lockScroll, unlockScroll } from "@/lib/utils/scrollLock";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Modal({ open, onClose, children, title, className }: ModalProps) {
  useEffect(() => {
    if (open) lockScroll();
    else unlockScroll();
    return () => { if (open) unlockScroll(); };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-md bg-bg rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto safe-bottom",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
