"use client";

import { Ban, ShieldOff } from "lucide-react";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils/cn";

interface BlockButtonProps {
  userId: string;
  className?: string;
  variant?: "button" | "menu";
  onAction?: () => void;
}

export function BlockButton({ userId, className, variant = "button", onAction }: BlockButtonProps) {
  const { isBlocked, blockUser, unblockUser } = usePrototype();
  const { showToast } = useToast();
  const blocked = isBlocked(userId);

  const handleClick = () => {
    if (blocked) {
      unblockUser(userId);
      showToast("User unblocked");
    } else {
      blockUser(userId);
      showToast("User blocked");
    }
    onAction?.();
  };

  if (variant === "menu") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-surface/80",
          !blocked && "text-like",
          className
        )}
      >
        {blocked ? <ShieldOff className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
        {blocked ? "Unblock" : "Block"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
        blocked
          ? "bg-surface border border-border text-text"
          : "border border-like/40 text-like glass-nav",
        className
      )}
    >
      {blocked ? <ShieldOff className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
      {blocked ? "Unblock" : "Block"}
    </button>
  );
}
