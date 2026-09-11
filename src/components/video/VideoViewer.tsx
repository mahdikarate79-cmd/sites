"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface VideoViewerProps {
  open: boolean;
  onClose: () => void;
  src: string;
  thumbnail?: string;
}

export function VideoViewer({ open, onClose, src, thumbnail }: VideoViewerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white safe-top"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>
      <video
        src={src}
        poster={thumbnail}
        className="w-full h-full max-h-dvh object-contain"
        controls
        autoPlay
        playsInline
      />
    </div>
  );
}
