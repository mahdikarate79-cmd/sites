"use client";

import Image from "next/image";
import { RotateCw, Crop } from "lucide-react";
import { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type CropPreset = "original" | "square" | "portrait" | "landscape";

interface MediaEditorProps {
  item: GalleryItem;
  rotation: number;
  crop: CropPreset;
  onRotationChange: (rotation: number) => void;
  onCropChange: (crop: CropPreset) => void;
}

const CROP_PRESETS: { id: CropPreset; label: string; className: string }[] = [
  { id: "original", label: "Original", className: "aspect-auto" },
  { id: "square", label: "1:1", className: "aspect-square" },
  { id: "portrait", label: "4:5", className: "aspect-[4/5]" },
  { id: "landscape", label: "16:9", className: "aspect-video" },
];

export function MediaEditor({ item, rotation, crop, onRotationChange, onCropChange }: MediaEditorProps) {
  const cropClass = CROP_PRESETS.find((p) => p.id === crop)?.className ?? "aspect-auto";

  return (
    <div className="space-y-3">
      <div className={cn("relative w-full max-h-48 mx-auto overflow-hidden rounded-xl bg-surface", cropClass)}>
        {item.type === "video" ? (
          <video
            src={item.url}
            className="w-full h-full object-cover"
            style={{ transform: `rotate(${rotation}deg)` }}
            muted
            playsInline
          />
        ) : (
          <Image
            src={item.url}
            alt=""
            fill
            className="object-cover"
            style={{ transform: `rotate(${rotation}deg)` }}
            unoptimized
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onRotationChange((rotation + 90) % 360)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-xs font-medium"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Rotate
        </button>
        <div className="flex items-center gap-1">
          <Crop className="w-3.5 h-3.5 text-text-muted" />
          {CROP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onCropChange(preset.id)}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                crop === preset.id ? "bg-[#8b5cf6]/20 text-[#8b5cf6]" : "bg-surface text-text-muted"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
