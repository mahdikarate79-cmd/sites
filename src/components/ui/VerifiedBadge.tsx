import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { PremiumParticles } from "./PremiumParticles";

const OFFICIAL_BADGE = "/badges/official.png";
const PREMIUM_BADGE = "/badges/premium.png";

export function OfficialVerificationBadge({ className }: { className?: string }) {
  return (
    <Image
      src={OFFICIAL_BADGE}
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
      src={PREMIUM_BADGE}
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
    return (
      <span className={cn("relative inline-flex shrink-0", size)}>
        {premium && <PremiumParticles count={3} centered animated />}
        <OfficialVerificationBadge className={cn(size, "relative z-[1]")} />
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex shrink-0", size)}>
      <PremiumVerificationBadge className={cn(size, "relative z-[1]")} />
    </span>
  );
}

/** @deprecated Use OfficialVerificationBadge */
export function VerifiedBadge({ className }: { className?: string }) {
  return <OfficialVerificationBadge className={className} />;
}
