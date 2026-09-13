"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Post } from "@/lib/types";
import { getPostById, getFeedPosts } from "@/lib/api/posts";
import { PostCard } from "./PostCard";

export function PostDetailView({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPostById(postId), getFeedPosts()])
      .then(([p, feed]) => {
        setPost(p ?? null);
        setAllPosts(feed);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return <div className="min-h-[50dvh] flex items-center justify-center text-text-muted text-sm">Loading…</div>;
  }

  if (!post) {
    return (
      <div className="min-h-[50dvh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold mb-2">Post not found</p>
        <Link href="/" className="mt-4 px-5 py-2.5 rounded-full glass-nav text-sm">Back to home</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Post</h1>
          <span className="text-xs text-text-muted ml-auto font-mono">{post.id}</span>
        </div>
      </div>
      <PostCard post={post} allPosts={allPosts} />
    </div>
  );
}
