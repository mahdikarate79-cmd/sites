import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Variant = "post" | "donate";

interface TelegramStarIconProps {
  variant?: Variant;
  size?: number;
  className?: string;
}

const ICONS: Record<Variant, string> = {
  post: "/icons/telegram-star-post.svg",
  donate: "/icons/telegram-star-donate.svg",
};

export function TelegramStarIcon({ variant = "post", size = 20, className }: TelegramStarIconProps) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const src = `${base}${ICONS[variant]}`;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
      unoptimized
    />
  );
}
