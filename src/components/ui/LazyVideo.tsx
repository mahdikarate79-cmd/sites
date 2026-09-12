"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LazyVideoProps {
  src: string;
  thumbnail?: string;
  className?: string;
  onPlay?: () => void;
  blurred?: boolean;
}

export function LazyVideo({ src, thumbnail, className, onPlay, blurred }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const poster = thumbnail && !thumbFailed ? thumbnail : undefined;

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
    <div className={cn("relative overflow-hidden bg-black cursor-pointer", className)} onClick={handleClick}>
      {!playing && poster && (
        <>
          <img
            src={poster}
            alt=""
            className={cn("absolute inset-0 w-full h-full object-cover", blurred && "blur-xl scale-110")}
            loading="lazy"
            onError={() => setThumbFailed(true)}
          />
          {!blurred && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
        </>
      )}
      {!playing && !poster && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <Play className="w-10 h-10 text-text-muted" />
        </div>
      )}
      <video
        ref={videoRef}
        src={playing ? src : undefined}
        poster={poster}
        className={cn("w-full h-full object-contain bg-black", !playing && "hidden")}
        controls={playing}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}
