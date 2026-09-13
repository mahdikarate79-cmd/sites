import { TransactionRecord } from "@/lib/types";
import { apiFetch } from "./fetch";

export interface WalletInfo {
  totalEarnings: number;
  withdrawable: number;
  starsLast21Days: number;
  meetsMinimum: boolean;
  canWithdraw: boolean;
  transactions: TransactionRecord[];
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
