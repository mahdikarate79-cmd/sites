"use client";

import { useState } from "react";
import { Post } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { updatePostApi } from "@/lib/api/social";
import { normalizeTags } from "@/lib/utils/postAccess";

interface EditPostModalProps {
  open: boolean;
  post: Post;
  onClose: () => void;
  onSaved: (post: Post) => void;
}

export function EditPostModal({ open, post, onClose, onSaved }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [tagInput, setTagInput] = useState((post.tags ?? []).map((t) => `#${t}`).join(" "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const tags = normalizeTags(tagInput);
    if (tags.length < 3) {
      setError("At least 3 tags required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updatePostApi(post.id, { content: content.trim(), tags });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-4 pb-6 space-y-4">
        <h2 className="text-base font-semibold">Edit post</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none resize-none"
          placeholder="Caption"
        />
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none"
          placeholder="#tags (min 3)"
        />
        {error && <p className="text-xs text-like">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-full bg-[#3b82f6] text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </BottomSheet>
  );
}
