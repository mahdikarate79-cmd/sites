"use client";

import { User } from "@/lib/types";
import { VerificationBadge } from "./VerifiedBadge";
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
  const verified = showOfficial && user.verified;
  const premium = showPremium && user.premium;

  return (
    <span className={cn("inline-flex items-center gap-0.5 min-w-0 max-w-full", className)}>
      <span className={cn("truncate", nameClassName)}>{user.displayName}</span>
      <VerificationBadge verified={verified} premium={premium} className="w-3.5 h-3.5" />
    </span>
  );
}
