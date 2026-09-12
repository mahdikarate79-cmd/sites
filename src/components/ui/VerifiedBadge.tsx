import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { assetPath } from "@/lib/utils/assets";

export function OfficialVerificationBadge({ className }: { className?: string }) {
  return (
    <Image
      src={assetPath("/badges/official.png")}
      alt="Verified"
      width={20}
      height={20}
      className={cn("shrink-0 object-contain", className)}
      unoptimized
    />
  );
}

export function PremiumVerificationBadge({ className }: { className?: string }) {
  return (
    <Image
      src={assetPath("/badges/premium.png")}
      alt="Premium"
      width={20}
      height={20}
      className={cn("shrink-0 object-contain", className)}
      unoptimized
    />
  );
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
