import { adminApiFetch } from "./fetch";
import { clearAdminToken, setAdminToken } from "./tokens";

export async function adminLogin(username: string, password: string) {
  const data = await adminApiFetch<{ ok: boolean; adminToken?: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (data.adminToken) setAdminToken(data.adminToken);
  return data;
}

export async function adminLogout() {
  try {
    await adminApiFetch("/api/admin/logout", { method: "POST" });
  } finally {
    clearAdminToken();
  }
}

export async function adminMe() {
  return adminApiFetch<{ ok: boolean; username: string }>("/api/admin/me");
}

export async function adminStats() {
  return adminApiFetch<Record<string, number>>("/api/admin/stats");
}

export async function adminAction(action: string, data: Record<string, unknown> = {}) {
  return adminApiFetch("/api/admin/action", { method: "POST", body: JSON.stringify({ action, ...data }) });
}

export async function adminChangeCredentials(currentPassword: string, newUsername?: string, newPassword?: string) {
  return adminApiFetch("/api/admin/credentials", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newUsername, newPassword }),
  });
}
