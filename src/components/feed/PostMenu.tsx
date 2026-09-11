"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Flag, EyeOff, UserX, Link2 } from "lucide-react";

export function PostMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { icon: Flag, label: "Report" },
    { icon: EyeOff, label: "Not interested" },
    { icon: UserX, label: "Mute user" },
    { icon: Link2, label: "Copy link" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-full hover:bg-surface transition-colors"
        aria-label="More options"
      >
        <MoreHorizontal className="w-4 h-4 text-text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-10 py-1 overflow-hidden">
          {items.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-bg transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-text-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
