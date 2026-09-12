import { getApiBase } from "./base";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
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

export function openTelegramInvoice(invoiceUrl: string, onResult: (status: string) => void) {
  const tg = (window as Window & { Telegram?: { WebApp?: { openInvoice: (url: string, cb: (s: string) => void) => void } } }).Telegram?.WebApp;
  if (tg?.openInvoice) {
    tg.openInvoice(invoiceUrl, onResult);
    return true;
  }
  return false;
}
