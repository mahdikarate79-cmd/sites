interface TelegramLogoProps {
  size?: number;
  className?: string;
}

/** Official-style Telegram paper plane logo */
export function TelegramLogo({ size = 56, className }: TelegramLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="tg-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#2AABEE" />
          <stop offset="100%" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#tg-grad)" />
      <path
        fill="#fff"
        d="M175.5 68.5L56 119.5c-6.5 2.8-6.4 12.2.2 14.7l30.2 11.2 11.6 36.8c1.8 5.7 8.7 7.4 13.1 3.4l16.5-15.1 32.4 23.9c4.4 3.3 10.7.9 11.9-4.6l19.1-99.2c1.3-6.8-5.4-12.2-11.9-9.8zM96.4 134.5l-.3 28.5c0 3.4-4.5 4.5-6.2 1.6l-12.8-20.5 19.3-9.6zm9.1-2.2l56.2-35.2c2.5-1.6 1.2-5.6-1.9-5.1L86.2 118l19.3-9.6z"
      />
    </svg>
  );
}
