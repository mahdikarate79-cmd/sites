"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LazyVideoProps {
  src: string;
  thumbnail?: string;
  className?: string;
  onPlay?: () => void;
}

export function LazyVideo({ src, thumbnail, className, onPlay }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handleClick = () => {
    if (onPlay) {
      onPlay();
      return;
    }
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className={cn("relative overflow-hidden bg-surface cursor-pointer", className)} onClick={handleClick}>
      {!playing && thumbnail && (
        <>
          <Image src={thumbnail} alt="Video thumbnail" fill className="object-cover" loading="lazy" sizes="100vw" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </>
      )}
      <video
        ref={videoRef}
        src={playing ? src : undefined}
        className={cn("w-full h-full object-cover", !playing && "hidden")}
        controls={playing}
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}
