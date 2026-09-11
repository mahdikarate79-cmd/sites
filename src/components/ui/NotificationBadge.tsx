import { formatBadgeCount } from "@/lib/store/prototypeStore";

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  const label = formatBadgeCount(count);
  if (!label) return null;

  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"
      aria-label={`${count} new`}
    >
      {label}
    </span>
  );
}
