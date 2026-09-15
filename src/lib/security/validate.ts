/** Lightweight client-side guards — real enforcement belongs on the server. */

const MAX_POST_CONTENT = 4000;
const MAX_TAG_COUNT = 12;
const MAX_TAG_LENGTH = 32;
import { MIN_STARS_PAYMENT } from "@/lib/constants/stars";

const MAX_STAR_SPEND_PER_ACTION = 25_000;
const MIN_ACTION_INTERVAL_MS = 400;

const lastActionAt: Record<string, number> = {};

export function sanitizePostContent(content: string): string {
  return content.trim().slice(0, MAX_POST_CONTENT);
}

export function sanitizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.trim().toLowerCase().slice(0, MAX_TAG_LENGTH)))].slice(0, MAX_TAG_COUNT);
}

export function assertValidStarSpend(stars: number, balance: number, actionKey = "default"): boolean {
  if (!Number.isFinite(stars) || stars < MIN_STARS_PAYMENT || stars > MAX_STAR_SPEND_PER_ACTION) return false;
  if (!Number.isFinite(balance) || balance < stars) return false;
  const now = Date.now();
  const last = lastActionAt[actionKey] ?? 0;
  if (now - last < MIN_ACTION_INTERVAL_MS) return false;
  lastActionAt[actionKey] = now;
  return true;
}

export function assertValidUnlock(postId: string, stars: number, balance: number, alreadyUnlocked: boolean): boolean {
  if (alreadyUnlocked) return false;
  if (!postId || stars < MIN_STARS_PAYMENT) return false;
  return assertValidStarSpend(stars, balance, `unlock:${postId}`);
}
