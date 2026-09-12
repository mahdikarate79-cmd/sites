import { AuthMeResponse, AuthUser } from "./types";
import { getApiBase } from "@/lib/api/base";

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Auth error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function authenticateWithTelegram(initData: string): Promise<AuthMeResponse> {
  return authFetch<AuthMeResponse>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData }),
  });
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return authFetch<AuthMeResponse>("/api/auth/me");
}

export async function logoutAuth(): Promise<void> {
  await authFetch("/api/auth/logout", { method: "POST" });
}

export async function deleteAuthAccount(): Promise<void> {
  await authFetch("/api/auth/delete-account", { method: "POST" });
}

export async function updateProfile(data: {
  displayName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  cover?: string;
}): Promise<AuthUser> {
  const res = await authFetch<{ user: AuthUser }>("/api/profile/update", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.user;
}

export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? null;
}
