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

export async function fetchNotifications(): Promise<ServerNotification[]> {
  const data = await apiFetch<{ notifications: ServerNotification[] }>("/api/notifications");
  return data.notifications ?? [];
}
