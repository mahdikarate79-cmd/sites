const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export async function submitVerificationRequest(): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/verification/request`, {
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
