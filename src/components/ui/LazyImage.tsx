"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

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
  const [error, setError] = useState(false);
  const displaySrc = error && thumbnail ? thumbnail : src;
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className={cn("relative overflow-hidden bg-black", className)} style={{ aspectRatio }}>
      {thumbnail && !loaded && !error && (
        <Image
          src={thumbnail}
          alt=""
          fill
          className={cn(fitClass, "blur-sm scale-105")}
          aria-hidden
          unoptimized
          onError={() => setError(true)}
        />
      )}
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={cn(
          fitClass,
          "transition-opacity duration-200",
          loaded ? "opacity-100" : thumbnail && !error ? "opacity-0" : "opacity-100",
          blurred && "blur-xl scale-110"
        )}
        loading="lazy"
        unoptimized
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error && thumbnail && displaySrc !== thumbnail) {
            setError(true);
            setLoaded(false);
          }
        }}
        sizes="(max-width: 768px) 100vw, 600px"
      />
    </div>
  );
}
