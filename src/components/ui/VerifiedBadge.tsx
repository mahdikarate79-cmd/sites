import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function OfficialVerificationBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] shrink-0", className)}
      aria-label="Official verification"
    />
  );
}

export function PremiumVerificationBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("w-4 h-4 text-[#8b5cf6] fill-[#8b5cf6] shrink-0", className)}
      aria-label="Premium verification"
    />
  );
}

/** @deprecated Use OfficialVerificationBadge */
export function VerifiedBadge({ className }: { className?: string }) {
  return <OfficialVerificationBadge className={className} />;
}
