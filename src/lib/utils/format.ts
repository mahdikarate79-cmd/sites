function formatCompact(n: number, divisor: number, suffix: string): string {
  const value = n / divisor;
  if (value >= 100) return `${Math.floor(value)}${suffix}`;
  const rounded = Math.round(value * 10) / 10;
  const str = rounded.toFixed(1).replace(/\.0$/, "");
  return `${str}${suffix}`;
}

export function formatCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return formatCompact(n, 1000, "k");
  if (n < 1_000_000_000) return formatCompact(n, 1_000_000, "m");
  return formatCompact(n, 1_000_000_000, "b");
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 52) return `${weeks}w`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatStars(n: number): string {
  return n.toLocaleString("en-US");
}
