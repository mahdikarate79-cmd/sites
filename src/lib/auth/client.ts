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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? `Auth error ${res.status}`), { data, status: res.status });
  }
  return data as T;
}

export async function authenticateWithTelegram(initData: string): Promise<AuthMeResponse> {
  const res = await fetch(`${getApiBase()}/api/auth/telegram`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 403 && data.error === "account_deleted") {
    return {
      user: null,
      loginMethod: "guest",
      accountDeleted: true,
      canRecreateAt: data.canRecreateAt,
      remainingMs: data.remainingMs,
    };
  }
  if (!res.ok) throw new Error(data.error ?? `Auth error ${res.status}`);
  return data as AuthMeResponse;
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
