"use client";

import { useState } from "react";
import Image from "next/image";
import { DollarSign, Film, Video as VideoIcon, Check, Clock, Crop } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { PaidMediaSheet } from "./PaidMediaSheet";
import { TemporaryMediaSheet } from "./TemporaryMediaSheet";
import { RotateCropSheet } from "./RotateCropSheet";
import { GalleryItem, TemporaryMode } from "@/lib/types";
import { mockGalleryItems } from "@/data/mock/gallery";
import { cn } from "@/lib/utils/cn";

export interface SelectedMedia {
  item: GalleryItem;
  rotation: number;
  mirrored: boolean;
  spoiler: boolean;
  paidStars?: number;
  temporary?: TemporaryMode;
}

interface MediaGalleryPickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (items: SelectedMedia[], caption: string) => void;
}

export function MediaGalleryPicker({ open, onClose, onSend }: MediaGalleryPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [mirrored, setMirrored] = useState(false);
  const [spoiler, setSpoiler] = useState(false);
  const [paidStars, setPaidStars] = useState(0);
  const [temporary, setTemporary] = useState<TemporaryMode | undefined>();
  const [paidOpen, setPaidOpen] = useState(false);
  const [tempOpen, setTempOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const previewItem = mockGalleryItems.find((i) => i.id === previewId);
  const selectedItems = mockGalleryItems.filter((i) => selected.has(i.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPreview = (id: string) => {
    if (!selected.has(id)) return;
    setPreviewId(id);
    setRotation(0);
    setMirrored(false);
  };

  const reset = () => {
    setSelected(new Set());
    setCaption("");
    setPreviewId(null);
    setPaidStars(0);
    setSpoiler(false);
    setTemporary(undefined);
    setRotation(0);
    setMirrored(false);
  };

  const handleSend = () => {
    const items: SelectedMedia[] = selectedItems.map((item) => ({
      item,
      rotation: previewId === item.id ? rotation : 0,
      mirrored: previewId === item.id ? mirrored : false,
      spoiler,
      paidStars: paidStars > 0 ? paidStars : undefined,
      temporary,
    }));
    if (items.length === 0) return;
    onSend(items, caption);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <>
      <BottomSheet open={open && !previewId} onClose={handleClose} className="max-h-[90dvh]">
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between py-2 mb-2">
            <h2 className="text-base font-semibold">Gallery</h2>
            {selected.size > 0 && (
              <button
                onClick={() => setPaidOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-xs font-medium"
              >
                <DollarSign className="w-4 h-4 text-gold" />
                Make this media paid
              </button>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
              {selectedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openPreview(item.id)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface ring-2 ring-transparent hover:ring-[#8b5cf6]/40"
                >
                  <Image src={item.thumbnail ?? item.url} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {mockGalleryItems.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden bg-surface",
                    isSelected && "ring-2 ring-[#8b5cf6]"
                  )}
                >
                  {item.type === "video" ? (
                    <>
                      <Image src={item.thumbnail ?? item.url} alt="" fill className="object-cover" unoptimized />
                      <VideoIcon className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow" />
                    </>
                  ) : item.type === "gif" ? (
                    <>
                      <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                      <Film className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow" />
                    </>
                  ) : (
                    <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#8b5cf6] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={selected.size === 0}
              className="relative px-4 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold disabled:opacity-40 shrink-0"
            >
              Send{selected.size > 0 ? ` ${selected.size}` : ""}
            </button>
          </div>
        </div>
      </BottomSheet>

      {previewItem && (
        <BottomSheet open={!!previewId} onClose={() => setPreviewId(null)} className="max-h-[92dvh]">
          <div className="px-4 pb-4">
            <div className="relative w-full aspect-[4/5] max-h-[50dvh] rounded-xl overflow-hidden bg-surface mb-3">
              {previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  className="w-full h-full object-cover"
                  style={{ transform: `rotate(${rotation}deg) scaleX(${mirrored ? -1 : 1})` }}
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={previewItem.url}
                  alt=""
                  fill
                  className="object-cover"
                  style={{ transform: `rotate(${rotation}deg) scaleX(${mirrored ? -1 : 1})` }}
                  unoptimized
                />
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTempOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium",
                  temporary ? "bg-[#8b5cf6]/15 text-[#8b5cf6]" : "bg-surface"
                )}
              >
                <Clock className="w-4 h-4" />
                Temporary
              </button>
              <button
                type="button"
                onClick={() => setCropOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-surface"
              >
                <Crop className="w-4 h-4" />
                Rotate/Crop
              </button>
            </div>

            {paidStars > 0 && (
              <p className="flex items-center gap-1 text-xs text-gold mb-2">
                <TelegramStarIcon variant="post" size={14} />
                {paidStars} paid media
              </p>
            )}

            <button
              onClick={() => setPreviewId(null)}
              className="w-full py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-medium"
            >
              Done
            </button>
          </div>
        </BottomSheet>
      )}

      <PaidMediaSheet open={paidOpen} onClose={() => setPaidOpen(false)} onConfirm={(s) => { setPaidStars(s); setPaidOpen(false); }} />
      <TemporaryMediaSheet open={tempOpen} onClose={() => setTempOpen(false)} value={temporary} onSelect={setTemporary} />
      <RotateCropSheet
        open={cropOpen}
        onClose={() => setCropOpen(false)}
        item={previewItem ?? null}
        rotation={rotation}
        mirrored={mirrored}
        onRotationChange={setRotation}
        onMirroredChange={setMirrored}
        onReset={() => { setRotation(0); setMirrored(false); }}
      />
    </>
  );
}
