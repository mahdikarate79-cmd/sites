"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar } from "@/components/ui/Avatar";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { Post, PostMedia } from "@/lib/types";
import {
  formatUploadLimit,
  getUploadLimitBytes,
  normalizeTags,
} from "@/lib/utils/postAccess";
import { cn } from "@/lib/utils/cn";
import {
  Image as ImageIcon,
  Lock,
  Star,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StarsSlider } from "@/components/donate/StarsSlider";

export default function NewPostPage() {
  const router = useRouter();
  const { getCurrentUser, addPost } = usePrototype();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const user = getCurrentUser();
  const uploadLimit = getUploadLimitBytes(!!user.premium);

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<PostMedia | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [paidEnabled, setPaidEnabled] = useState(false);
  const [paidStars, setPaidStars] = useState(50);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [followersOnly, setFollowersOnly] = useState(true);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const canPost = content.trim().length > 0 || !!media;
  const tagsValid = tags.length >= 3;

  const handleFile = (file: File) => {
    if (file.size > uploadLimit) {
      showToast(
        user.premium
          ? `File exceeds ${formatUploadLimit(uploadLimit)} limit`
          : `Max ${formatUploadLimit(uploadLimit)} for free accounts — upgrade to Premium for up to 1 GB`
      );
      return;
    }
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video/") ? "video" : "image";
    setMediaPreview(url);
    setMedia({
      type,
      url,
      thumbnail: type === "image" ? url : undefined,
      objectKey: `posts/user/${Date.now()}_${file.name}`,
    });
  };

  const addTagsFromInput = () => {
    const newTags = normalizeTags(tagInput);
    if (!newTags.length) return;
    setTags((prev) => [...new Set([...prev, ...newTags])].slice(0, 12));
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handlePost = async () => {
    if (!canPost || posting) return;
    if (!tagsValid) {
      showToast("Add at least 3 tags for categorization");
      setSettingsOpen(true);
      return;
    }

    setPosting(true);
    const post: Post = {
      id: `up_${Date.now()}`,
      author: user,
      content: content.trim(),
      media: media ? [media] : undefined,
      tags,
      paidStars: paidEnabled && media ? paidStars : undefined,
      privacy: privacyEnabled
        ? { enabled: true, followersOnly, followingOnly }
        : undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      views: 0,
      shares: 0,
      stars: 0,
    };

    addPost(post);
    showToast("Post published");
    router.push("/");
  };

  return (
    <AppLayout title="New Post">
      <div className="px-4 py-4 pb-8 max-w-lg mx-auto">
        <div className="flex gap-3 mb-4">
          <Avatar src={user.avatar} alt={user.displayName} size="md" className="shrink-0" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a caption..."
            className="flex-1 min-h-[100px] text-[15px] leading-relaxed outline-none resize-none bg-transparent placeholder:text-text-muted"
            autoFocus
          />
        </div>

        {mediaPreview && media && (
          <div className="relative mb-4 rounded-2xl overflow-hidden border border-border aspect-[4/3] bg-surface">
            {media.type === "video" ? (
              <video src={mediaPreview} className="w-full h-full object-cover" controls playsInline />
            ) : (
              <Image src={mediaPreview} alt="" fill className="object-cover" unoptimized />
            )}
            <button
              type="button"
              onClick={() => { setMedia(null); setMediaPreview(null); }}
              className="absolute top-2 right-2 p-1.5 rounded-full glass-nav"
              aria-label="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
            {paidEnabled && (
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full glass-pill flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 text-gold" />
                <span className="tabular-nums">{paidStars}</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        <div className="glass-nav rounded-2xl overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
          >
            <span>Post settings</span>
            {settingsOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </button>

          {settingsOpen && (
            <div className="px-4 pb-4 space-y-4 border-t border-border/50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-text-muted" />
                  <span className="text-xs font-medium">Tags (min 3)</span>
                  <span className={cn("text-[10px] ml-auto", tagsValid ? "text-green-400" : "text-text-muted")}>
                    {tags.length}/3+
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTagsFromInput(); } }}
                    placeholder="#design #photo ..."
                    className="flex-1 px-3 py-2 rounded-xl bg-bg/50 border border-border text-sm outline-none"
                  />
                  <button type="button" onClick={addTagsFromInput} className="px-3 py-2 rounded-xl bg-surface text-xs font-medium">
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => removeTag(t)}
                        className="px-2 py-0.5 rounded-full glass-pill text-[11px] text-text-muted"
                      >
                        #{t} ×
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-text-muted mt-1.5">Tags help categorize posts for search — not shown on the post card.</p>
              </div>

              {media && (
                <div className="pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setPaidEnabled(!paidEnabled)}
                    className="flex items-center justify-between w-full py-1"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gold" />
                      <span className="text-sm">Paid media</span>
                    </div>
                    <div className={cn("w-9 h-5 rounded-full transition-colors relative", paidEnabled ? "bg-[#3b82f6]" : "bg-surface border border-border")}>
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left]", paidEnabled ? "left-[18px]" : "left-0.5")} />
                    </div>
                  </button>
                  {paidEnabled && (
                    <div className="mt-3 px-1">
                      <StarsSlider value={paidStars} min={1} max={500} onChange={setPaidStars} compact />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setPrivacyEnabled(!privacyEnabled)}
                  className="flex items-center justify-between w-full py-1"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-text-muted" />
                    <span className="text-sm">Private post</span>
                  </div>
                  <div className={cn("w-9 h-5 rounded-full transition-colors relative", privacyEnabled ? "bg-[#3b82f6]" : "bg-surface border border-border")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left]", privacyEnabled ? "left-[18px]" : "left-0.5")} />
                  </div>
                </button>
                {privacyEnabled && (
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={followersOnly} onChange={(e) => setFollowersOnly(e.target.checked)} className="rounded" />
                      Followers only
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={followingOnly} onChange={(e) => setFollowingOnly(e.target.checked)} className="rounded" />
                      Following only
                    </label>
                    <p className="text-[10px] text-text-muted">Enable either or both. If privacy is off, the post is public.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-nav text-sm"
          >
            <ImageIcon className="w-4 h-4" />
            Media
          </button>
          <span className="text-[10px] text-text-muted flex-1 text-center">
            Max {formatUploadLimit(uploadLimit)}
          </span>
          <button
            type="button"
            onClick={handlePost}
            disabled={!canPost || posting}
            className="px-6 py-2.5 rounded-full bg-[#3b82f6] text-white text-sm font-semibold disabled:opacity-30 transition-opacity"
          >
            Post
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
