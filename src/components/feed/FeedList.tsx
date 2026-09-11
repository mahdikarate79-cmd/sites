"use client";

import { useEffect, useState } from "react";
import { Post } from "@/lib/types";
import { PostCard } from "./PostCard";
import { getFeedPosts } from "@/lib/api/posts";

export function FeedList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

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
                <div className="h-3 bg-surface rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
