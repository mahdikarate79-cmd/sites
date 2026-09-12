interface TelegramLogoProps {
  size?: number;
  className?: string;
}

/** Official Telegram app icon (square, solid blue) */
export function TelegramLogo({ size = 56, className }: TelegramLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      aria-hidden
      role="img"
    >
      <rect width="240" height="240" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M175.189 68.315L56.609 119.508c-8.634 3.726-8.523 15.57.182 19.015l30.396 11.265 11.668 36.951c1.828 5.715 8.919 7.434 13.458 3.445l16.585-15.2 32.482 23.903c4.558 3.417 11.036.948 12.27-4.772l19.088-99.213c1.312-6.824-5.454-12.236-12.069-9.825zM97.43 134.447l-.286 28.58c0 3.454-4.573 4.563-6.254 1.628l-12.925-20.853 19.465-9.355zm9.753-2.085l56.69-35.502c2.521-1.615 1.209-5.648-1.922-5.18l-72.816 26.897 19.048-9.355z"
      />
    </svg>
  );
}
