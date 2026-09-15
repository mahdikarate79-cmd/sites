"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { followUserApi } from "@/lib/api/social";
import { PremiumParticles } from "./PremiumParticles";

interface FollowButtonProps {
  userId: string;
  size?: "sm" | "md";
  className?: string;
  initialFollowing?: boolean;
}

export function FollowButton({ userId, size = "md", className, initialFollowing }: FollowButtonProps) {
  const { isFollowing, toggleFollow } = usePrototype();
  const { requireMiniApp } = useTelegramGate();
  const [following, setFollowing] = useState(initialFollowing ?? isFollowing(userId));
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (initialFollowing !== undefined) setFollowing(initialFollowing);
    else setFollowing(isFollowing(userId));
  }, [initialFollowing, isFollowing, userId]);

  const handleClick = async () => {
    if (!requireMiniApp()) return;
    const next = !following;
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    setFollowing(next);
    toggleFollow(userId);
    try {
      await followUserApi(userId, !next);
    } catch {
      setFollowing(!next);
      toggleFollow(userId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative rounded-full font-medium transition-all glass-nav",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        following
          ? "text-text-muted border border-border"
          : "text-white bg-gradient-to-r from-[#6366f1]/80 to-[#8b5cf6]/80 border border-[#8b5cf6]/30",
        className
      )}
    >
      {burst && <PremiumParticles count={4} animated />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
