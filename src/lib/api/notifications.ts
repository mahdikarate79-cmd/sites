import { getApiBase } from "./base";

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

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchNotifications(): Promise<ServerNotification[]> {
  const data = await apiFetch<{ notifications: ServerNotification[] }>("/api/notifications");
  return data.notifications ?? [];
}
