"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-lg bg-bg rounded-t-2xl max-h-[85dvh] overflow-y-auto safe-bottom animate-[sheet-up_0.28s_ease-out]",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border sticky top-0 bg-bg/95 backdrop-blur-sm z-10">
            <h2 className="text-base font-semibold">{title}</h2>
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
