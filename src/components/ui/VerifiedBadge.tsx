import { cn } from "@/lib/utils/cn";
import { PremiumParticles } from "./PremiumParticles";

/** 8-scallop Telegram-style verification badge */
function BadgeShape({ fill, className }: { fill: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("shrink-0", className)} aria-hidden>
      <path
        d="M10 1.2c.28 0 .52.17.62.43l.48 1.15 1.24-.1c.26-.02.51.12.62.36.1.24.07.52-.09.71l-.95 1.05.82.98c.14.17.16.41.04.6-.12.19-.36.29-.59.25l-1.22-.22-.58 1.08c-.11.21-.33.34-.57.34-.24 0-.46-.13-.57-.34l-.58-1.08-1.22.22c-.23.04-.47-.06-.59-.25-.12-.19-.1-.43.04-.6l.82-.98-.95-1.05c-.16-.19-.19-.47-.09-.71.11-.24.36-.38.62-.36l1.24.1.48-1.15c.1-.26.34-.43.62-.43z"
        fill={fill}
      />
      <path
        d="M7.2 10.1 L9.1 12.1 13.1 8.3"
        stroke="white"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OfficialVerificationBadge({ className }: { className?: string }) {
  return <BadgeShape fill="#1d9bf0" className={className} />;
}

export function PremiumVerificationBadge({ className }: { className?: string }) {
  return <BadgeShape fill="#8b5cf6" className={className} />;
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
      <PremiumParticles count={3} centered animated />
      <PremiumVerificationBadge className={cn(size, "relative z-[1]")} />
    </span>
  );
}

/** @deprecated Use OfficialVerificationBadge */
export function VerifiedBadge({ className }: { className?: string }) {
  return <OfficialVerificationBadge className={className} />;
}
