"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { PremiumParticles } from "./PremiumParticles";

interface FollowButtonProps {
  userId: string;
  size?: "sm" | "md";
  className?: string;
}

export function FollowButton({ userId, size = "md", className }: FollowButtonProps) {
  const { isFollowing, toggleFollow } = usePrototype();
  const { requireMiniApp } = useTelegramGate();
  const following = isFollowing(userId);
  const [burst, setBurst] = useState(false);

  const handleClick = () => {
    if (!requireMiniApp()) return;
    if (!following) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    toggleFollow(userId);
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
