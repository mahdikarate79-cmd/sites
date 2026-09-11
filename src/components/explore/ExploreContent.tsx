"use client";

import { useState } from "react";
import { Search, TrendingUp, Clock, Flame, Filter } from "lucide-react";
import { trendingTopics, categories, mockPosts } from "@/data/mock/posts";
import { PostCard } from "@/components/feed/PostCard";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Tab = "trending" | "newest" | "popular";

export function ExploreContent() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("trending");
  const [category, setCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: "trending" as Tab, label: "Trending", icon: TrendingUp },
    { id: "newest" as Tab, label: "Newest", icon: Clock },
    { id: "popular" as Tab, label: "Popular", icon: Flame },
  ];

  const filteredPosts = mockPosts.filter((p) => {
    if (query && !p.content.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (tab === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (tab === "popular") return b.likes - a.likes;
    return b.views - a.views;
  });

  return (
    <div>
      <div className="px-4 py-3 sticky top-14 z-30 bg-bg/90 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search Sheytoni..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none focus:border-text-muted transition-colors"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-bg transition-colors"
            aria-label="Filters"
          >
            <Filter className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors",
                  category === cat
                    ? "bg-text text-bg border-text"
                    : "border-border text-text-muted hover:border-text-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2",
              tab === id
                ? "border-text text-text"
                : "border-transparent text-text-muted"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "trending" && !query && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-muted mb-2">Hot Topics</h3>
          <div className="space-y-2">
            {trendingTopics.map((t, i) => (
              <button
                key={t.id}
                className="flex items-center justify-between w-full py-1.5 text-left hover:bg-surface rounded-lg px-2 -mx-2 transition-colors"
              >
                <div>
                  <span className="text-xs text-text-muted">{i + 1} · Trending</span>
                  <p className="text-sm font-medium">{t.tag}</p>
                </div>
                <span className="text-xs text-text-muted">{formatCount(t.posts)} posts</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sortedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
