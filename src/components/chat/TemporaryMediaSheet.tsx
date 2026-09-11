"use client";

import { Clock, Flame } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TemporaryMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface TemporaryMediaSheetProps {
  open: boolean;
  onClose: () => void;
  value?: TemporaryMode;
  onSelect: (mode: TemporaryMode | undefined) => void;
}

const OPTIONS: { id: TemporaryMode; label: string; icon: typeof Clock; flame?: boolean }[] = [
  { id: "view_once", label: "View Once", icon: Flame, flame: true },
  { id: "3s", label: "3 Seconds", icon: Clock },
  { id: "10s", label: "10 Seconds", icon: Clock },
  { id: "30s", label: "30 Seconds", icon: Clock },
];

export function TemporaryMediaSheet({ open, onClose, value, onSelect }: TemporaryMediaSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Temporary">
      <div className="px-4 pb-4 space-y-1">
        {OPTIONS.map(({ id, label, icon: Icon, flame }) => (
          <button
            key={id}
            type="button"
            onClick={() => { onSelect(id); onClose(); }}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm transition-colors",
              value === id ? "bg-[#8b5cf6]/15 text-[#8b5cf6]" : "hover:bg-surface/60"
            )}
          >
            <Icon className={cn("w-5 h-5", flame && "text-orange-400 animate-pulse")} />
            {label}
          </button>
        ))}
        {value && (
          <button
            type="button"
            onClick={() => { onSelect(undefined); onClose(); }}
            className="w-full px-4 py-3 text-sm text-text-muted hover:bg-surface/60 rounded-xl"
          >
            Remove timer
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
