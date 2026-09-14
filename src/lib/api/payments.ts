import { apiFetch } from "./fetch";

export interface InvoiceResponse {
  invoiceUrl: string | null;
  intentId: string;
}

export async function createStarsPurchaseInvoice(amount: number): Promise<InvoiceResponse> {
  return apiFetch("/api/payments/invoice", {
    method: "POST",
    body: JSON.stringify({ type: "stars", amount }),
  });
}

export async function createPremiumInvoice(planId: string): Promise<InvoiceResponse> {
  return apiFetch("/api/payments/invoice", {
    method: "POST",
    body: JSON.stringify({ type: "premium", planId }),
  });
}

export async function createPostUnlockInvoice(postId: string, stars: number): Promise<InvoiceResponse> {
  return apiFetch("/api/payments/invoice", {
    method: "POST",
    body: JSON.stringify({ type: "post_unlock", postId, stars }),
  });
}

export async function createDonationInvoice(
  postId: string,
  recipientId: string,
  stars: number,
  anonymous: boolean,
): Promise<InvoiceResponse> {
  return apiFetch("/api/payments/invoice", {
    method: "POST",
    body: JSON.stringify({ type: "donation", postId, recipientId, stars, anonymous }),
  });
}

export async function createPaidMediaInvoice(
  chatId: string,
  messageId: string,
  recipientId: string,
  stars: number,
): Promise<InvoiceResponse> {
  return apiFetch("/api/payments/invoice", {
    method: "POST",
    body: JSON.stringify({ type: "paid_media", chatId, messageId, recipientId, stars }),
  });
}

export async function fetchUnlockedPosts(): Promise<string[]> {
  const data = await apiFetch<{ postIds: string[] }>("/api/user/unlocks");
  return data.postIds ?? [];
}

export function openTelegramInvoice(invoiceUrl: string, onResult: (status: string) => void) {
  const tg = (window as Window & { Telegram?: { WebApp?: { openInvoice: (url: string, cb: (s: string) => void) => void } } }).Telegram?.WebApp;
  if (tg?.openInvoice) {
    tg.openInvoice(invoiceUrl, onResult);
    return true;
  }
  return false;
}
