import { getApiBase } from "./base";
import { TransactionRecord } from "@/lib/types";

export interface WalletInfo {
  totalEarnings: number;
  withdrawable: number;
  starsLast21Days: number;
  meetsMinimum: boolean;
  canWithdraw: boolean;
  transactions: TransactionRecord[];
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? err.message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchWallet(): Promise<WalletInfo> {
  return apiFetch("/api/wallet");
}

export async function requestWithdrawal(stars: number, wallet: string): Promise<{ ok: boolean; id: string }> {
  return apiFetch("/api/withdrawals/request", {
    method: "POST",
    body: JSON.stringify({ stars, wallet }),
  });
}
