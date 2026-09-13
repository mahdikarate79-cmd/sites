import { AuthMeResponse, AuthUser } from "./types";
import { getApiBase } from "@/lib/api/base";
import { apiFetch } from "@/lib/api/fetch";
import { clearSessionToken, setSessionToken } from "@/lib/api/tokens";

export async function authenticateWithTelegram(initData: string): Promise<AuthMeResponse> {
  const res = await fetch(`${getApiBase()}/api/auth/telegram`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 403 && data.error === "account_deleted") {
    clearSessionToken();
    return {
      user: null,
      loginMethod: "guest",
      accountDeleted: true,
      canRecreateAt: data.canRecreateAt,
      remainingMs: data.remainingMs,
    };
  }
  if (!res.ok) throw new Error(data.error ?? `Auth error ${res.status}`);
  if (data.sessionToken) setSessionToken(data.sessionToken);
  return data as AuthMeResponse;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const data = await apiFetch<AuthMeResponse>("/api/auth/me");
  if (data.sessionToken) setSessionToken(data.sessionToken);
  else if (!data.user) clearSessionToken();
  return data;
}

export async function logoutAuth(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearSessionToken();
  }
}

export async function deleteAuthAccount(): Promise<void> {
  try {
    await apiFetch("/api/auth/delete-account", { method: "POST" });
  } finally {
    clearSessionToken();
  }
}

export async function updateProfile(data: {
  displayName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  cover?: string;
}): Promise<AuthUser> {
  const res = await apiFetch<{ user: AuthUser }>("/api/profile/update", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.user;
}

export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? null;
}
