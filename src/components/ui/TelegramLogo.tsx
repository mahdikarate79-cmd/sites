import { assetPath } from "@/lib/utils/assets";

interface TelegramLogoProps {
  size?: number;
  className?: string;
}

/** Official Telegram logo — circular mask over uploaded brand asset */
export function TelegramLogo({ size = 56, className }: TelegramLogoProps) {
  return (
    <img
      src={assetPath("/telegram-logo.jpg")}
      alt="Telegram"
      width={size}
      height={size}
      className={`rounded-full object-cover block shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}
