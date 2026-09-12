"use client";

import { User } from "@/lib/types";
import { OfficialVerificationBadge } from "./VerifiedBadge";
import { PremiumParticles } from "./PremiumParticles";
import { cn } from "@/lib/utils/cn";

interface UserNameProps {
  user: Pick<User, "displayName" | "verified" | "premium">;
  className?: string;
  nameClassName?: string;
  showPremium?: boolean;
  showOfficial?: boolean;
}

export function UserName({
  user,
  className,
  nameClassName,
  showPremium = true,
  showOfficial = true,
}: UserNameProps) {
  const hasOfficial = showOfficial && user.verified;
  const hasPremium = showPremium && user.premium;

  return (
    <span className={cn("inline-flex items-center gap-0.5 min-w-0 max-w-full", className)}>
      <span className={cn("truncate", nameClassName)}>{user.displayName}</span>
      {hasOfficial && (
        <span className="relative shrink-0 w-3.5 h-3.5">
          {hasPremium && <PremiumParticles count={3} centered animated />}
          <OfficialVerificationBadge className="w-3.5 h-3.5 relative z-[1]" />
        </span>
      )}
      {!hasOfficial && hasPremium && (
        <span className="relative shrink-0 w-3.5 h-3.5">
          <PremiumParticles count={3} centered animated />
          <span className="relative z-[1] w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
            <span className="text-[6px] text-white font-bold">P</span>
          </span>
        </span>
      )}
    </span>
  );
}
