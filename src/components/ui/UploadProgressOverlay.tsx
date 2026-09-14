"use client";

import { Loader2 } from "lucide-react";

interface UploadProgressOverlayProps {
  open: boolean;
  progress: number;
  label?: string;
}

export function UploadProgressOverlay({ open, progress, label }: UploadProgressOverlayProps) {
  if (!open) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-md px-6">
      <div className="glass-nav rounded-3xl p-6 w-full max-w-[300px] text-center space-y-4 shadow-2xl border border-white/10">
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#8b5cf6]" aria-hidden />
        </div>
        <p className="text-sm font-semibold">{label ?? "Uploading…"}</p>
        <div className="h-2.5 rounded-full bg-surface/80 overflow-hidden border border-border/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#3b82f6] transition-all duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted tabular-nums">{pct}%</p>
      </div>
    </div>
  );
}
