import { Donator, PostDonationState, PrototypeState, TransactionRecord } from "@/lib/types";
import { currentUser } from "@/data/mock/users";

const STORAGE_KEY = "sheytoni-prototype";

const DEFAULT_STATE: PrototypeState = {
  following: [],
  blocked: [],
  interestedPosts: [],
  interestedAuthors: [],
  notInterestedPosts: [],
  notInterestedAuthors: [],
  hiddenPosts: [],
  donations: {},
  likes: {},
  bookmarks: {},
  savedReels: [],
  chatUnread: 3,
  notificationUnread: 10,
  deletedChats: [],
  earnings: 2500,
  starBalance: 999_999,
  transactions: [
    {
      id: "t1",
      type: "donation",
      amount: 150,
      label: "Donation from @alex",
      date: "2026-09-10T14:30:00Z",
      from: "u2",
      status: "completed",
      hash: "0xa1b2c3d4",
    },
    {
      id: "t2",
      type: "donation",
      amount: 75,
      label: "Donation from @sara",
      date: "2026-09-09T09:15:00Z",
      from: "u3",
      status: "completed",
      hash: "0xe5f6a7b8",
    },
    {
      id: "t3",
      type: "withdrawal",
      amount: -500,
      label: "Withdrawal to TON wallet",
      date: "2026-09-05T18:00:00Z",
      status: "completed",
      hash: "0xc9d0e1f2",
    },
    {
      id: "t5",
      type: "premium",
      amount: -25,
      label: "Premium subscription",
      date: "2026-09-01T08:00:00Z",
      status: "completed",
      hash: "0xf3a4b5c6",
    },
  ],
  unlockedPaidMedia: {},
  expiredTempMedia: {},
  viewedTempMedia: {},
  tempMediaOpenedAt: {},
  comments: {},
  commentCounts: {},
  profileEdits: {},
  userPosts: [],
  unlockedPaidPosts: [],
};

export const UNLIMITED_STAR_REFILL = 999_999;

export function ensureStarBalance(balance: number): number {
  return balance < 100_000 ? UNLIMITED_STAR_REFILL : balance;
}

export function createTransaction(
  partial: Omit<TransactionRecord, "id" | "date"> & { date?: string }
): TransactionRecord {
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: partial.date ?? new Date().toISOString(),
    status: partial.status ?? "completed",
    hash: partial.hash ?? `0x${Math.random().toString(16).slice(2, 10)}`,
    ...partial,
  };
}

export function loadState(): PrototypeState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: PrototypeState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function formatBadgeCount(n: number): string | null {
  if (n <= 0) return null;
  if (n >= 100) return "+99";
  return String(n);
}

export function getPostDonation(state: PrototypeState, postId: string, initial?: PostDonationState): PostDonationState {
  return state.donations[postId] ?? initial ?? { total: 0, topDonators: [] };
}

export function computeDonationRank(
  amount: number,
  topDonators: Donator[],
  anonymous: boolean
): { rank: number; preview: Donator[] } {
  const withoutCurrent = topDonators.filter((d) => d.user.id !== currentUser.id);
  const prevUser = topDonators.find((d) => d.user.id === currentUser.id);
  const current = {
    rank: 0,
    user: currentUser,
    stars: (prevUser?.stars ?? 0) + amount,
    anonymous,
  };

  const all = [...withoutCurrent, current].sort((a, b) => b.stars - a.stars);
  const preview = all.slice(0, 3).map((d, i) => ({ ...d, rank: i + 1 }));
  const rank = all.findIndex((d) => d.user.id === currentUser.id) + 1;
  return { rank, preview };
}
