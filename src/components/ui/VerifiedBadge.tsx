import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={className ?? "w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] shrink-0"}
      aria-label="Verified"
    />
  );
}
