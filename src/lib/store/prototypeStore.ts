import { Donator, PostDonationState, PrototypeState } from "@/lib/types";
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
  earnings: 0,
};

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
