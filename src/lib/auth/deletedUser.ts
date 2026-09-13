import { User } from "@/lib/types";
import { clearPrototypeStorage } from "@/lib/store/prototypeStore";

export const DELETED_ACCOUNT_ID = "deleted_account";

export const DELETED_USER: User = {
  id: DELETED_ACCOUNT_ID,
  username: "deleted",
  displayName: "Deleted Account",
  avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=deleted",
  followers: 0,
  following: 0,
  postsCount: 0,
};

const deletedIds = new Set<string>();

export function markUserDeleted(userId: string): void {
  deletedIds.add(userId);
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("sheytoni-deleted-users");
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(userId)) {
      localStorage.setItem("sheytoni-deleted-users", JSON.stringify([...list, userId]));
    }
  }
}

export function loadDeletedUserIds(): Set<string> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("sheytoni-deleted-users");
      if (raw) JSON.parse(raw).forEach((id: string) => deletedIds.add(id));
    } catch { /* ignore */ }
  }
  return deletedIds;
}

export function isDeletedUser(userId: string): boolean {
  loadDeletedUserIds();
  return deletedIds.has(userId) || userId.startsWith("deleted_");
}

export function resolveUser(user: User): User {
  if (isDeletedUser(user.id)) return DELETED_USER;
  return user;
}

export function clearLocalUserData(userId?: string | null): void {
  clearPrototypeStorage(userId);
}
