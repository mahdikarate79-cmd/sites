"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { User } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { ProfileLink, profilePath } from "@/components/ui/ProfileLink";
import { FollowButton } from "@/components/ui/FollowButton";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchFollowers, fetchFollowing, fetchUserProfile } from "@/lib/api/social";

interface FollowListContentProps {
  mode: "followers" | "following";
}

export function FollowListContent({ mode }: FollowListContentProps) {
  const searchParams = useSearchParams();
  const targetSlug = searchParams.get("u");
  const { user: me, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const title = mode === "followers" ? "Followers" : "Following";
  const isOwnList = !targetSlug || targetSlug === me?.username || targetSlug === me?.id;

  useEffect(() => {
    if (!isAuthenticated || !me?.id) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDenied(false);

    const load = async () => {
      try {
        let userId = me.id;
        if (targetSlug && !isOwnList) {
          if (!me.premium) {
            setDenied(true);
            setUsers([]);
            return;
          }
          const profile = await fetchUserProfile(targetSlug);
          setTargetUser(profile.user);
          userId = profile.user.id;
        } else {
          setTargetUser(me);
        }
        const list = mode === "followers" ? await fetchFollowers(userId) : await fetchFollowing(userId);
        setUsers(list);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mode, me?.id, me?.premium, isAuthenticated, targetSlug, isOwnList]);

  const backHref = isOwnList ? "/settings/" : (targetUser && !targetUser.deleted ? profilePath(targetUser) : "/");

  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href={backHref} className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">
            {title}
            {targetUser && !isOwnList ? ` · ${targetUser.displayName}` : ""}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto divide-y divide-border">
        {loading ? (
          <p className="text-center text-text-muted py-12 text-sm">Loading…</p>
        ) : denied ? (
          <p className="text-center text-text-muted py-12 text-sm px-6">
            Premium members can view other users&apos; follower and following lists.
          </p>
        ) : users.length > 0 ? users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
            {u.deleted ? (
              <>
                <Avatar src="" alt="" size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-muted">Deleted Account</p>
                </div>
              </>
            ) : (
              <>
                <ProfileLink user={u} className="shrink-0">
                  <Avatar src={u.avatar} alt="" size="md" />
                </ProfileLink>
                <ProfileLink user={u} className="flex-1 min-w-0">
                  <UserName user={u} nameClassName="text-sm font-semibold" />
                  <p className="text-xs text-text-muted truncate">@{u.username ?? "—"}</p>
                </ProfileLink>
                {u.id !== me?.id && <FollowButton userId={u.id} size="sm" />}
              </>
            )}
          </div>
        )) : (
          <p className="text-center text-text-muted py-12 text-sm">No {title.toLowerCase()} yet</p>
        )}
      </div>
    </div>
  );
}
