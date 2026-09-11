"use client";

import Image from "next/image";
import { FlipHorizontal, RotateCw } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface RotateCropSheetProps {
  open: boolean;
  onClose: () => void;
  item: GalleryItem | null;
  rotation: number;
  mirrored: boolean;
  onRotationChange: (rotation: number) => void;
  onMirroredChange: (mirrored: boolean) => void;
  onReset: () => void;
}

export function RotateCropSheet({
  open,
  onClose,
  item,
  rotation,
  mirrored,
  onRotationChange,
  onMirroredChange,
  onReset,
}: RotateCropSheetProps) {
  if (!item) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit media">
      <div className="px-4 pb-4">
        <div className="relative w-full aspect-[4/5] max-h-56 rounded-xl overflow-hidden bg-surface mb-4 mx-auto">
          {item.type === "video" ? (
            <video src={item.url} className="w-full h-full object-cover" style={{ transform: `rotate(${rotation}deg) scaleX(${mirrored ? -1 : 1})` }} muted playsInline />
          ) : (
            <Image
              src={item.url}
              alt=""
              fill
              className="object-cover"
              style={{ transform: `rotate(${rotation}deg) scaleX(${mirrored ? -1 : 1})` }}
              unoptimized
            />
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => onMirroredChange(!mirrored)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-surface"
          >
            <FlipHorizontal className="w-5 h-5" />
            <span className="text-xs">Mirror</span>
          </button>
          <button
            type="button"
            onClick={() => onRotationChange((rotation + 90) % 360)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-surface"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-xs">Rotate</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface text-sm">Cancel</button>
          <button type="button" onClick={onReset} className="flex-1 py-2.5 rounded-xl bg-surface text-sm">Reset</button>
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-medium">Crop</button>
        </div>
      </div>
    </BottomSheet>
  );
}
