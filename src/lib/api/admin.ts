const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Admin error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function adminLogin(username: string, password: string) {
  return adminFetch("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function adminLogout() {
  return adminFetch("/api/admin/logout", { method: "POST" });
}

export async function adminMe() {
  return adminFetch<{ ok: boolean; username: string }>("/api/admin/me");
}

export async function adminStats() {
  return adminFetch<Record<string, number>>("/api/admin/stats");
}

export async function adminAction(action: string, data: Record<string, unknown> = {}) {
  return adminFetch("/api/admin/action", { method: "POST", body: JSON.stringify({ action, ...data }) });
}

export async function adminChangeCredentials(currentPassword: string, newUsername?: string, newPassword?: string) {
  return adminFetch("/api/admin/credentials", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newUsername, newPassword }),
  });
}
