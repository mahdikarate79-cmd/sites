import { User } from "@/lib/types";

/** URL slug for profile routes — never exposes raw Telegram numeric id in the path when username exists */
export function profileSlug(user: Pick<User, "id" | "username">): string {
  if (user.username?.trim()) return encodeURIComponent(user.username.trim().toLowerCase());
  return encodeURIComponent(user.id);
}

/** Public handle line — hides internal tg_* ids */
export function profileHandle(user: Pick<User, "id" | "username">): string | null {
  if (user.username?.trim()) return `@${user.username.trim().toLowerCase()}`;
  return null;
}
