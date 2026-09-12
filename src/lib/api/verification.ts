import { getApiBase } from "./base";

export async function submitVerificationRequest(): Promise<{ ok: boolean }> {
  const res = await fetch(`${getApiBase()}/api/verification/request`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}
