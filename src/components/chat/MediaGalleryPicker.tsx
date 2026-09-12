"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DollarSign, Film, Video as VideoIcon, Check, Clock, Crop, ImagePlus } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { PaidMediaSheet } from "./PaidMediaSheet";
import { TemporaryMediaSheet } from "./TemporaryMediaSheet";
import { RotateCropSheet } from "./RotateCropSheet";
import { GalleryItem, TemporaryMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface SelectedMedia {
  item: GalleryItem;
  rotation: number;
  mirrored: boolean;
  spoiler: boolean;
  paidStars?: number;
  temporary?: TemporaryMode;
  croppedUrl?: string;
}

interface MediaEdit {
  rotation: number;
  mirrored: boolean;
  croppedUrl?: string;
}

interface MediaGalleryPickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (items: SelectedMedia[], caption: string) => void;
}

function fileToGalleryItem(file: File, index: number): GalleryItem {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");
  const isGif = file.type === "image/gif";
  return {
    id: `device_${Date.now()}_${index}`,
    type: isVideo ? "video" : isGif ? "gif" : "image",
    url,
    thumbnail: isVideo ? url : undefined,
  };
}

export function MediaGalleryPicker({ open, onClose, onSend }: MediaGalleryPickerProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, MediaEdit>>({});
  const [caption, setCaption] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [spoiler, setSpoiler] = useState(false);
  const [paidStars, setPaidStars] = useState(0);
  const [temporary, setTemporary] = useState<TemporaryMode | undefined>();
  const [paidOpen, setPaidOpen] = useState(false);
  const [tempOpen, setTempOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewItem = galleryItems.find((i) => i.id === previewId);
  const previewEdit = previewId ? edits[previewId] ?? { rotation: 0, mirrored: false } : { rotation: 0, mirrored: false };
  const selectedItems = galleryItems.filter((i) => selected.has(i.id));

  useEffect(() => {
    if (open && galleryItems.length === 0) {
      fileInputRef.current?.click();
    }
  }, [open, galleryItems.length]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const imageVideo = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    const newItems = imageVideo.map((f, i) => fileToGalleryItem(f, i));
    setGalleryItems((prev) => [...prev, ...newItems]);
    setSelected((prev) => new Set([...prev, ...newItems.map((n) => n.id)]));
  };

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
  };

  const updatePreviewEdit = (patch: Partial<MediaEdit>) => {
    if (!previewId) return;
    setEdits((prev) => ({
      ...prev,
      [previewId]: { ...(prev[previewId] ?? { rotation: 0, mirrored: false }), ...patch },
    }));
  };

  const reset = () => {
    galleryItems.forEach((item) => {
      if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
    });
    setGalleryItems([]);
    setSelected(new Set());
    setEdits({});
    setCaption("");
    setPreviewId(null);
    setPaidStars(0);
    setSpoiler(false);
    setTemporary(undefined);
  };

  const handleSend = () => {
    const items: SelectedMedia[] = selectedItems.map((item) => {
      const edit = edits[item.id] ?? { rotation: 0, mirrored: false };
      return {
        item: edit.croppedUrl ? { ...item, url: edit.croppedUrl, type: "image" as const } : item,
        rotation: edit.rotation,
        mirrored: edit.mirrored,
        croppedUrl: edit.croppedUrl,
        spoiler,
        paidStars: paidStars > 0 ? paidStars : undefined,
        temporary,
      };
    });
    if (items.length === 0) return;
    onSend(items, caption);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const previewDisplayUrl = previewEdit.croppedUrl ?? previewItem?.url;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      <BottomSheet open={open && !previewId} onClose={handleClose} className="max-h-[90dvh]">
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between py-2 mb-2">
            <h2 className="text-base font-semibold">Gallery</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-xs font-medium"
              >
                <ImagePlus className="w-4 h-4" />
                Add
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => setPaidOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-xs font-medium"
                >
                  <DollarSign className="w-4 h-4 text-gold" />
                  Paid
                </button>
              )}
            </div>
          </div>

          {galleryItems.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-12 rounded-2xl border border-dashed border-border flex flex-col items-center gap-2 text-text-muted mb-4"
            >
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm">Select photos & videos from your device</span>
            </button>
          ) : (
            <>
              {selectedItems.length > 0 && (
                <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
                  {selectedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openPreview(item.id)}
                      className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface ring-2 ring-transparent hover:ring-[#8b5cf6]/40"
                    >
                      <Image src={edits[item.id]?.croppedUrl ?? item.thumbnail ?? item.url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5 mb-4 max-h-[40dvh] overflow-y-auto">
                {galleryItems.map((item) => {
                  const isSelected = selected.has(item.id);
                  const thumb = edits[item.id]?.croppedUrl ?? item.thumbnail ?? item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      onDoubleClick={() => { if (isSelected) openPreview(item.id); }}
                      className={cn("relative aspect-square rounded-lg overflow-hidden bg-surface", isSelected && "ring-2 ring-[#8b5cf6]")}
                    >
                      {item.type === "video" ? (
                        <>
                          <Image src={thumb} alt="" fill className="object-cover" unoptimized />
                          <VideoIcon className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow" />
                        </>
                      ) : item.type === "gif" ? (
                        <>
                          <Image src={thumb} alt="" fill className="object-cover" unoptimized />
                          <Film className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow" />
                        </>
                      ) : (
                        <Image src={thumb} alt="" fill className="object-cover" unoptimized />
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
            </>
          )}

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
                  src={previewDisplayUrl}
                  className="w-full h-full object-cover"
                  style={{ transform: `rotate(${previewEdit.rotation}deg) scaleX(${previewEdit.mirrored ? -1 : 1})` }}
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={previewDisplayUrl ?? previewItem.url}
                  alt=""
                  fill
                  className="object-cover"
                  style={{ transform: `rotate(${previewEdit.rotation}deg) scaleX(${previewEdit.mirrored ? -1 : 1})` }}
                  unoptimized
                />
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setTempOpen(true)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium", temporary ? "bg-[#8b5cf6]/15 text-[#8b5cf6]" : "bg-surface")}>
                <Clock className="w-4 h-4" />
                Temporary
              </button>
              <button type="button" onClick={() => setCropOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-surface">
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

            <button onClick={() => setPreviewId(null)} className="w-full py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-medium">
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
        rotation={previewEdit.rotation}
        mirrored={previewEdit.mirrored}
        croppedUrl={previewEdit.croppedUrl}
        onRotationChange={(r) => updatePreviewEdit({ rotation: r })}
        onMirroredChange={(m) => updatePreviewEdit({ mirrored: m })}
        onCroppedUrlChange={(url) => updatePreviewEdit({ croppedUrl: url })}
        onReset={() => updatePreviewEdit({ rotation: 0, mirrored: false, croppedUrl: undefined })}
      />
    </>
  );
}
