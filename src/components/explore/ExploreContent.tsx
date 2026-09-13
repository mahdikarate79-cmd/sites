"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, Video, ImageIcon, Film } from "lucide-react";
import { Post, User } from "@/lib/types";
import { getFeedPosts } from "@/lib/api/posts";
import { searchUsers } from "@/lib/api/social";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { ReelsViewer } from "@/components/video/ReelsViewer";
import { buildReelItems } from "@/lib/utils/reels";
import { shouldExcludeFromPublicDiscovery } from "@/lib/utils/postAccess";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type SearchTab = "accounts" | "reels";
type SortFilter = "newest" | "popular" | "views" | "oldest";

function postMatchesQuery(post: Post, q: string): boolean {
  if (!q) return true;
  const tagQ = q.replace(/^#/, "");
  return (
    post.content.toLowerCase().includes(q) ||
    !!post.tags?.some((t) => t.includes(tagQ)) ||
    (post.category?.toLowerCase().includes(q) ?? false) ||
    (post.author.username ?? "").toLowerCase().includes(q) ||
    post.author.displayName.toLowerCase().includes(q)
  );
}

export function ExploreContent() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("accounts");
  const [filter, setFilter] = useState<SortFilter>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getFeedPosts().then(setAllPosts);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setAccounts([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchUsers(q)
        .then(setAccounts)
        .catch(() => setAccounts([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const publicPosts = useMemo(
    () => allPosts.filter((p) => !shouldExcludeFromPublicDiscovery(p)),
    [allPosts]
  );

  const reelItems = useMemo(() => buildReelItems(publicPosts), [publicPosts]);

  const reels = useMemo(() => {
    let items = [...reelItems];
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter((item) => postMatchesQuery(item.post, q));
    }
    return items.sort((a, b) => {
      const pa = a.post;
      const pb = b.post;
      if (filter === "newest") return new Date(pb.createdAt).getTime() - new Date(pa.createdAt).getTime();
      if (filter === "oldest") return new Date(pa.createdAt).getTime() - new Date(pb.createdAt).getTime();
      if (filter === "views") return pb.views - pa.views;
      return pb.likes - pa.likes;
    });
  }, [query, filter, reelItems]);

  const openReel = (index: number) => {
    setReelIndex(index);
    setReelsOpen(true);
  };

  const filterLabels: { id: SortFilter; label: string }[] = [
    { id: "newest", label: "Newest" },
    { id: "popular", label: "Most Popular" },
    { id: "views", label: "Most Viewed" },
    { id: "oldest", label: "Oldest" },
  ];

  return (
    <div>
      <div className="px-5 pt-5 pb-4 sticky top-0 z-30 bg-bg/90 backdrop-blur-sm safe-top">
        <div className="relative mx-1 mt-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search Sheytoni..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-11 py-3 rounded-2xl bg-surface border border-border text-sm outline-none focus:border-text-muted transition-colors"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-bg transition-colors"
            aria-label="Filters"
          >
            <Filter className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {showFilters && tab === "reels" && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
            {filterLabels.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors",
                  filter === id ? "bg-text text-bg border-text" : "border-border text-text-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex border-b border-border">
        {(["accounts", "reels"] as SearchTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2",
              tab === t ? "border-text text-text" : "border-transparent text-text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "accounts" && (
        <div className="divide-y divide-border">
          {!query.trim() ? (
            <p className="text-center text-text-muted py-12 text-sm px-4">
              Search for users by @username or display name
            </p>
          ) : searching ? (
            <p className="text-center text-text-muted py-12 text-sm">Searching…</p>
          ) : accounts.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username || user.id}/`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface/40 transition-colors"
            >
              <Avatar src={user.avatar} alt="" size="lg" />
              <div className="flex-1 min-w-0">
                <UserName user={user} nameClassName="font-semibold text-sm" />
                <p className="text-xs text-text-muted">@{user.username ?? user.id}</p>
                <p className="text-xs text-text-muted mt-0.5">{formatCount(user.followers)} followers</p>
              </div>
            </Link>
          ))}
          {query.trim() && !searching && accounts.length === 0 && (
            <p className="text-center text-text-muted py-12 text-sm">No accounts found</p>
          )}
        </div>
      )}

      {tab === "reels" && (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {reels.map((item, i) => {
            const thumb = item.media.thumbnail ?? item.media.url;
            const Icon = item.media.type === "video" ? Video : item.media.type === "gif" ? Film : ImageIcon;
            return (
              <button
                key={`${item.post.id}-${item.mediaIndex}`}
                type="button"
                onClick={() => openReel(i)}
                className="relative aspect-[3/4] bg-black overflow-hidden"
              >
                {thumb ? (
                  <Image src={thumb} alt="" fill className="object-cover" sizes="33vw" unoptimized />
                ) : (
                  <div className="w-full h-full bg-surface" />
                )}
                <Icon className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-white drop-shadow" />
              </button>
            );
          })}
          {reels.length === 0 && (
            <p className="col-span-3 text-center text-text-muted py-12 text-sm">
              {query.trim() ? "No reels found" : "No public posts yet"}
            </p>
          )}
        </div>
      )}

      {reelsOpen && (
        <ReelsViewer
          open
          onClose={() => setReelsOpen(false)}
          items={reels}
          initialIndex={reelIndex}
        />
      )}
    </div>
  );
}
