"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { User } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { FollowButton } from "@/components/ui/FollowButton";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchFollowers, fetchFollowing } from "@/lib/api/social";

interface FollowListContentProps {
  mode: "followers" | "following";
}

export function FollowListContent({ mode }: FollowListContentProps) {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const title = mode === "followers" ? "Followers" : "Following";

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUsers([]);
      setLoading(false);
      return;
    }
    const load = mode === "followers" ? fetchFollowers(user.id) : fetchFollowing(user.id);
    load
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [mode, user?.id, isAuthenticated]);

  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto divide-y divide-border">
        {loading ? (
          <p className="text-center text-text-muted py-12 text-sm">Loading…</p>
        ) : users.length > 0 ? users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
            <Link href={`/profile/${u.username || u.id}/`} className="shrink-0">
              <Avatar src={u.avatar} alt="" size="md" />
            </Link>
            <Link href={`/profile/${u.username || u.id}/`} className="flex-1 min-w-0">
              <UserName user={u} nameClassName="text-sm font-semibold" />
              <p className="text-xs text-text-muted truncate">@{u.username ?? "—"}</p>
            </Link>
            <FollowButton userId={u.id} size="sm" />
          </div>
        )) : (
          <p className="text-center text-text-muted py-12 text-sm">No {title.toLowerCase()} yet</p>
        )}
      </div>
    </div>
  );
}
