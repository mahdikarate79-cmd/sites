"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { ProfileContent } from "./ProfileContent";
import { fetchUserProfile } from "@/lib/api/social";
import { useAuth } from "@/lib/hooks/useAuth";

interface ProfileLoaderProps {
  username: string;
}

function resolveUsernameFromPath(propUsername: string): string {
  if (typeof window === "undefined") return decodeURIComponent(propUsername);
  const parts = window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  const idx = parts.indexOf("profile");
  if (idx >= 0 && parts[idx + 1]) {
    const slug = decodeURIComponent(parts[idx + 1]);
    if (slug !== "placeholder") return slug;
  }
  return decodeURIComponent(propUsername);
}

export function ProfileLoader({ username }: ProfileLoaderProps) {
  const { user: me } = useAuth();
  const [slug, setSlug] = useState(() => resolveUsernameFromPath(username));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolved = resolveUsernameFromPath(username);
    setSlug(resolved);
    setLoading(true);
    fetchUserProfile(resolved)
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return <div className="min-h-[50dvh] flex items-center justify-center text-text-muted text-sm">Loading profile…</div>;
  }

  if (!user || user.deleted) {
    const hideSlug = slug.startsWith("tg_") || slug === "deleted";
    return (
      <div className="min-h-[50dvh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold mb-2">Account unavailable</p>
        {!hideSlug && slug && !slug.includes("@") && (
          <p className="text-sm text-text-muted">@{slug.replace(/^@/, "")}</p>
        )}
      </div>
    );
  }

  const isOwnProfile = me?.id === user.id || me?.username === user.username;
  return <ProfileContent user={user} isOwnProfile={isOwnProfile} />;
}
