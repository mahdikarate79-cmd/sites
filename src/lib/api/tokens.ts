const SESSION_KEY = "sheytoni_session_token";
const ADMIN_KEY = "sheytoni_admin_token";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch { /* ignore */ }
}

function remove(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function getSessionToken(): string | null {
  return read(SESSION_KEY);
}

export function setSessionToken(token: string) {
  write(SESSION_KEY, token);
}

export function clearSessionToken() {
  remove(SESSION_KEY);
}

export function getAdminToken(): string | null {
  return read(ADMIN_KEY);
}

export function setAdminToken(token: string) {
  write(ADMIN_KEY, token);
}

export function clearAdminToken() {
  remove(ADMIN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
