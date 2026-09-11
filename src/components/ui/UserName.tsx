"use client";

import { User } from "@/lib/types";
import { OfficialVerificationBadge, PremiumVerificationBadge } from "./VerifiedBadge";
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
  return (
    <span className={cn("inline-flex items-center gap-0.5 min-w-0 max-w-full", className)}>
      <span className={cn("truncate", nameClassName)}>{user.displayName}</span>
      {showOfficial && user.verified && <OfficialVerificationBadge className="w-3.5 h-3.5 shrink-0" />}
      {showPremium && user.premium && <PremiumVerificationBadge className="w-3.5 h-3.5 shrink-0" />}
    </span>
  );
}
