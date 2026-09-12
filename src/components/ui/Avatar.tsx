"use client";

import { cn } from "@/lib/utils/cn";
import Image from "next/image";

interface AvatarProps {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  return (
    <div className={cn("relative rounded-full overflow-hidden shrink-0 bg-surface", sizes[size], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        loading="lazy"
        sizes={size === "xl" ? "80px" : size === "lg" ? "56px" : "40px"}
        unoptimized={src.startsWith("data:")}
      />
    </div>
  );
}
