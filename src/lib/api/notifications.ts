import { apiFetch } from "./fetch";

export interface ServerNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  icon?: string;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<{ notifications: ServerNotification[]; unreadCount: number }> {
  const data = await apiFetch<{ notifications: ServerNotification[]; unreadCount?: number }>("/api/notifications");
  const notifications = data.notifications ?? [];
  const unreadCount = data.unreadCount ?? notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount };
}

export async function markNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/mark-read", { method: "POST" });
}
