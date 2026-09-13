import { apiFetch } from "./fetch";

export async function submitVerificationRequest(): Promise<{ ok: boolean }> {
  return apiFetch("/api/verification/request", { method: "POST" });
}
