"use client";

import { cn } from "@/lib/utils/cn";
import { useAssetPath } from "@/lib/hooks/useAssetPath";

function BadgeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const href = useAssetPath(src);
  return (
    <img
      src={href}
      alt={alt}
      className={cn("shrink-0 object-contain", className)}
      width={20}
      height={20}
      draggable={false}
    />
  );
}

export function OfficialVerificationBadge({ className }: { className?: string }) {
  return <BadgeImg src="/badges/official.png" alt="Verified" className={className} />;
}

export function PremiumVerificationBadge({ className }: { className?: string }) {
  return <BadgeImg src="/badges/premium.png" alt="Premium" className={className} />;
}

export function VerificationBadge({
  verified,
  premium,
  className,
}: {
  verified?: boolean;
  premium?: boolean;
  className?: string;
}) {
  if (!verified && !premium) return null;

  const size = className ?? "w-3.5 h-3.5";

  if (verified) {
    return <OfficialVerificationBadge className={size} />;
  }

  return <PremiumVerificationBadge className={size} />;
}

/** @deprecated Use OfficialVerificationBadge */
export function VerifiedBadge({ className }: { className?: string }) {
  return <OfficialVerificationBadge className={className} />;
}
