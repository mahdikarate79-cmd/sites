import { getApiBase } from "./base";
import { getAdminAuthHeaders, getAuthHeaders } from "./tokens";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { message?: string }).message
      ?? (data as { error?: string }).error
      ?? `API error ${res.status}`;
    throw Object.assign(new Error(message), {
      data,
      status: res.status,
    });
  }
  return data as T;
}

export async function adminApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Admin error ${res.status}`);
  }
  return data as T;
}
