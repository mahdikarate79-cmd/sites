"use client";

import { useState } from "react";
import Image from "next/image";
import { DollarSign, Film, Video as VideoIcon, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { MediaEditor } from "./MediaEditor";
import { PaidMediaSheet } from "./PaidMediaSheet";
import { GalleryItem } from "@/lib/types";
import { mockGalleryItems } from "@/data/mock/gallery";
import { cn } from "@/lib/utils/cn";

export interface SelectedMedia {
  item: GalleryItem;
  rotation: number;
  crop: "original" | "square" | "portrait" | "landscape";
  spoiler: boolean;
  paidStars?: number;
}

interface MediaGalleryPickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (items: SelectedMedia[], caption: string) => void;
}

export function MediaGalleryPicker({ open, onClose, onSend }: MediaGalleryPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<"original" | "square" | "portrait" | "landscape">("original");
  const [spoiler, setSpoiler] = useState(false);
  const [paidStars, setPaidStars] = useState(0);
  const [paidOpen, setPaidOpen] = useState(false);

  const editingItem = mockGalleryItems.find((i) => i.id === editingId);
  const selectedItems = mockGalleryItems.filter((i) => selected.has(i.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEditor = (id: string) => {
    setEditingId(id);
    setRotation(0);
    setCrop("original");
  };

  const reset = () => {
    setSelected(new Set());
    setCaption("");
    setEditingId(null);
    setPaidStars(0);
    setSpoiler(false);
  };

  const handleSend = () => {
    const items: SelectedMedia[] = selectedItems.map((item) => ({
      item,
      rotation: editingId === item.id ? rotation : 0,
      crop: editingId === item.id ? crop : "original",
      spoiler,
      paidStars: paidStars > 0 ? paidStars : undefined,
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
      <BottomSheet open={open} onClose={handleClose} className="max-h-[90dvh]">
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
                <div key={item.id} className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface">
                  <Image
                    src={item.thumbnail ?? item.url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {editingItem && (
            <div className="mb-3 p-3 rounded-xl bg-surface border border-border">
              <MediaEditor
                item={editingItem}
                rotation={rotation}
                crop={crop}
                onRotationChange={setRotation}
                onCropChange={setCrop}
              />
              <div className="flex gap-3 text-xs mt-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
                  Spoiler
                </label>
                {paidStars > 0 && (
                  <span className="flex items-center gap-1 text-gold">
                    <TelegramStarIcon variant="post" size={14} />
                    {paidStars}
                  </span>
                )}
              </div>
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
                  onDoubleClick={() => openEditor(item.id)}
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

      <PaidMediaSheet
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        onConfirm={(stars) => {
          setPaidStars(stars);
          setPaidOpen(false);
        }}
      />
    </>
  );
}
