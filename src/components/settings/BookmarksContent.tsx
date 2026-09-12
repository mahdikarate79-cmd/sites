"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockPosts } from "@/data/mock/posts";
import { PostCard } from "@/components/feed/PostCard";
import { usePrototype } from "@/lib/hooks/usePrototype";

export function BookmarksContent() {
  const { getBookmarkedPosts } = usePrototype();
  const bookmarked = getBookmarkedPosts(mockPosts);

  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Bookmarks</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {bookmarked.length > 0 ? (
          bookmarked.map((post) => <PostCard key={post.id} post={post} allPosts={mockPosts} />)
        ) : (
          <p className="text-center text-text-muted py-12 text-sm">No bookmarked posts yet</p>
        )}
      </div>
    </div>
  );
}
