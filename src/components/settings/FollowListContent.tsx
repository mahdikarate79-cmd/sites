"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockUsers } from "@/data/mock/users";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { FollowButton } from "@/components/ui/FollowButton";
import { usePrototype } from "@/lib/hooks/usePrototype";

interface FollowListContentProps {
  mode: "followers" | "following";
}

export function FollowListContent({ mode }: FollowListContentProps) {
  const { isFollowing } = usePrototype();
  const title = mode === "followers" ? "Followers" : "Following";

  const users = mode === "following"
    ? mockUsers.filter((u) => isFollowing(u.id))
    : mockUsers.filter((u) => u.id !== "u1").slice(0, 6);

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
        {users.length > 0 ? users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-4 py-3.5">
            <Link href={`/profile/${user.username}/`} className="shrink-0">
              <Avatar src={user.avatar} alt="" size="md" />
            </Link>
            <Link href={`/profile/${user.username}/`} className="flex-1 min-w-0">
              <UserName user={user} nameClassName="text-sm font-semibold" />
              <p className="text-xs text-text-muted truncate">@{user.username}</p>
            </Link>
            <FollowButton userId={user.id} size="sm" />
          </div>
        )) : (
          <p className="text-center text-text-muted py-12 text-sm">No {title.toLowerCase()} yet</p>
        )}
      </div>
    </div>
  );
}
