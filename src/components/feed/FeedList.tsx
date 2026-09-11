"use client";

import { useEffect, useState } from "react";
import { Post } from "@/lib/types";
import { PostCard } from "./PostCard";
import { getFeedPosts } from "@/lib/api/posts";
import { usePrototype } from "@/lib/hooks/usePrototype";

export function FeedList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const { filterPosts, sortPosts } = usePrototype();

  useEffect(() => {
    getFeedPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const videoPosts = posts.filter((p) => p.media?.some((m) => m.type === "video"));
  const visible = sortPosts(filterPosts(posts)).filter((p) => !hidden.has(p.id));

  const handleHide = (postId: string) => {
    setHidden((prev) => new Set([...prev, postId]));
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-3 border-b border-border animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface rounded w-1/3" />
                <div className="h-3 bg-surface rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {visible.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onHide={() => handleHide(post.id)}
          videoPosts={videoPosts}
        />
      ))}
    </div>
  );
}
