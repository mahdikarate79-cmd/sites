"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FlipHorizontal, RotateCw } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GalleryItem } from "@/lib/types";
import { cropImageToDataUrl, CropRect } from "@/lib/utils/cropImage";

interface RotateCropSheetProps {
  open: boolean;
  onClose: () => void;
  item: GalleryItem | null;
  rotation: number;
  mirrored: boolean;
  croppedUrl?: string;
  onRotationChange: (rotation: number) => void;
  onMirroredChange: (mirrored: boolean) => void;
  onCroppedUrlChange: (url: string | undefined) => void;
  onReset: () => void;
}

const CONTAINER_SIZE = 280;

export function RotateCropSheet({
  open,
  onClose,
  item,
  rotation,
  mirrored,
  croppedUrl,
  onRotationChange,
  onMirroredChange,
  onCroppedUrlChange,
  onReset,
}: RotateCropSheetProps) {
  const [crop, setCrop] = useState<CropRect>({ x: 40, y: 40, size: 200 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const size = Math.min(200, CONTAINER_SIZE - 40);
      const offset = (CONTAINER_SIZE - size) / 2;
      setCrop({ x: offset, y: offset, size });
    }
  }, [open, item?.id]);

  const displayUrl = croppedUrl ?? item?.url ?? "";

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, cropX: crop.x, cropY: crop.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const max = CONTAINER_SIZE - crop.size;
    setCrop((c) => ({
      ...c,
      x: Math.max(0, Math.min(max, dragStart.current.cropX + dx)),
      y: Math.max(0, Math.min(max, dragStart.current.cropY + dy)),
    }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const handleApplyCrop = useCallback(async () => {
    if (!item || item.type === "video") {
      onClose();
      return;
    }
    try {
      const url = await cropImageToDataUrl(displayUrl, crop, CONTAINER_SIZE, CONTAINER_SIZE, rotation, mirrored);
      onCroppedUrlChange(url);
      onClose();
    } catch {
      onClose();
    }
  }, [item, displayUrl, crop, rotation, mirrored, onCroppedUrlChange, onClose]);

  if (!item) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit media">
      <div className="px-4 pb-4">
        <div
          ref={containerRef}
          className="relative w-[280px] h-[280px] mx-auto rounded-xl overflow-hidden bg-black mb-4"
        >
          {item.type === "video" ? (
            <video src={displayUrl} className="w-full h-full object-cover" style={{ transform: `rotate(${rotation}deg) scaleX(${mirrored ? -1 : 1})` }} muted playsInline />
          ) : (
            <Image
              src={displayUrl}
              alt=""
              fill
              className="object-cover"
              style={{ transform: `rotate(${rotation}deg) scaleX(${mirrored ? -1 : 1})` }}
              unoptimized
            />
          )}
          {item.type !== "video" && (
            <div
              className="absolute border-2 border-white rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move touch-none"
              style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => onMirroredChange(!mirrored)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-surface">
            <FlipHorizontal className="w-5 h-5" />
            <span className="text-xs">Mirror</span>
          </button>
          <button type="button" onClick={() => onRotationChange((rotation + 90) % 360)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-surface">
            <RotateCw className="w-5 h-5" />
            <span className="text-xs">Rotate</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface text-sm">Cancel</button>
          <button type="button" onClick={() => { onReset(); onCroppedUrlChange(undefined); }} className="flex-1 py-2.5 rounded-xl bg-surface text-sm">Reset</button>
          <button type="button" onClick={handleApplyCrop} className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-medium">
            {item.type === "video" ? "Done" : "Crop"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
