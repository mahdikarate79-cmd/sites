import { AuthUser } from "@/lib/auth/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface InvoiceResponse {
  invoiceUrl: string | null;
  intentId: string;
  dev?: boolean;
}

export async function createPremiumInvoice(planId: string): Promise<InvoiceResponse> {
  return apiFetch("/api/payments/invoice", {
    method: "POST",
    body: JSON.stringify({ type: "premium", planId }),
  });
}

export async function confirmDevPayment(intentId: string): Promise<{ user: AuthUser }> {
  return apiFetch("/api/payments/confirm-dev", {
    method: "POST",
    body: JSON.stringify({ intentId }),
  });
}

export function openTelegramInvoice(invoiceUrl: string, onResult: (status: string) => void) {
  const tg = (window as Window & { Telegram?: { WebApp?: { openInvoice: (url: string, cb: (s: string) => void) => void } } }).Telegram?.WebApp;
  if (tg?.openInvoice) {
    tg.openInvoice(invoiceUrl, onResult);
    return true;
  }
  return false;
}
