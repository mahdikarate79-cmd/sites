"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { resolveMediaUrl } from "@/lib/utils/mediaUrl";

interface LazyImageProps {
  src: string;
  thumbnail?: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  blurred?: boolean;
  objectFit?: "cover" | "contain";
}

export function LazyImage({
  src,
  thumbnail,
  alt,
  className,
  aspectRatio,
  blurred,
  objectFit = "cover",
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";
  const resolvedSrc = resolveMediaUrl(src) || src;
  const resolvedThumb = thumbnail ? resolveMediaUrl(thumbnail) || thumbnail : undefined;
  const placeholder = resolvedThumb && resolvedThumb !== resolvedSrc ? resolvedThumb : null;

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)} style={{ aspectRatio }}>
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          className={cn("absolute inset-0 w-full h-full", fitClass, "blur-sm scale-105")}
          aria-hidden
        />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        className={cn(
          "absolute inset-0 w-full h-full",
          fitClass,
          placeholder && !loaded ? "opacity-0" : "opacity-100",
          "transition-opacity duration-200",
          blurred && "blur-xl scale-110"
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const img = e.currentTarget;
          if (placeholder && img.src !== placeholder) {
            img.src = placeholder;
          }
        }}
      />
    </div>
  );
}
