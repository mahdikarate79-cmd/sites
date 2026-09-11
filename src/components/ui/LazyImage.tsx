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
}

export function LazyImage({ src, thumbnail, alt, className, aspectRatio }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)} style={{ aspectRatio }}>
      {thumbnail && !loaded && (
        <Image
          src={thumbnail}
          alt=""
          fill
          className="object-cover blur-sm scale-105"
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        sizes="(max-width: 768px) 100vw, 600px"
      />
    </div>
  );
}
