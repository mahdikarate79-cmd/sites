"use client";

import { cn } from "@/lib/utils/cn";
import { useAssetPath } from "@/lib/hooks/useAssetPath";

type Variant = "post" | "donate";

interface TelegramStarIconProps {
  variant?: Variant;
  size?: number;
  className?: string;
}

const ICONS: Record<Variant, string> = {
  post: "/icons/telegram-stars-post.png",
  donate: "/icons/telegram-stars-donate.png",
};

export function TelegramStarIcon({ variant = "post", size = 20, className }: TelegramStarIconProps) {
  const src = useAssetPath(ICONS[variant]);

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 object-contain",
        variant === "post" && "opacity-90 saturate-110",
        variant === "donate" && "opacity-95",
        className
      )}
      aria-hidden
      draggable={false}
    />
  );
}
