"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar } from "@/components/ui/Avatar";
import { currentUser } from "@/data/mock/users";
import { Image as ImageIcon } from "lucide-react";

export default function NewPostPage() {
  const [content, setContent] = useState("");

  return (
    <AppLayout title="New Post">
      <div className="px-4 py-4">
        <div className="flex gap-3">
          <Avatar src={currentUser.avatar} alt={currentUser.displayName} size="md" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="flex-1 min-h-[120px] text-[15px] leading-relaxed outline-none resize-none bg-transparent placeholder:text-text-muted"
            autoFocus
          />
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <button className="p-2 rounded-full hover:bg-surface transition-colors" aria-label="Add image">
            <ImageIcon className="w-5 h-5 text-text-muted" />
          </button>
          <button
            disabled={!content.trim()}
            className="px-5 py-2 rounded-full bg-text text-bg text-sm font-semibold disabled:opacity-30 transition-opacity"
          >
            Post
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
