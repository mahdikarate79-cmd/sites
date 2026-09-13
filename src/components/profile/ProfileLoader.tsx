"use client";

import { useEffect, useState } from "react";
import { User, Post } from "@/lib/types";
import { ProfileContent } from "./ProfileContent";
import { fetchUserProfile } from "@/lib/api/social";
import { useAuth } from "@/lib/hooks/useAuth";

interface ProfileLoaderProps {
  username: string;
}

export function ProfileLoader({ username }: ProfileLoaderProps) {
  const { user: me } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = decodeURIComponent(username);
    fetchUserProfile(slug)
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return <div className="min-h-[50dvh] flex items-center justify-center text-text-muted text-sm">Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[50dvh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold mb-2">User not found</p>
      </div>
    );
  }

  const isOwnProfile = me?.id === user.id || me?.username === user.username;
  return <ProfileContent user={user} isOwnProfile={isOwnProfile} />;
}
