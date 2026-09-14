import crypto from "crypto";
import { getCreatorStats } from "./social.mjs";

export const HOLD_MS = 21 * 24 * 60 * 60 * 1000;
export const MIN_STARS_21_DAYS = 1000;

export function ensureEarningsLedger(db) {
  if (!db.earningsLedger) db.earningsLedger = {};
}

export function addEarningsCredit(db, userId, stars, type, meta = {}) {
  if (!stars || stars <= 0) return;
  ensureEarningsLedger(db);
  if (!db.earningsLedger[userId]) db.earningsLedger[userId] = [];
  const now = Date.now();
  db.earningsLedger[userId].push({
    id: `ec_${crypto.randomBytes(6).toString("hex")}`,
    stars,
    withdrawn: 0,
    type,
    createdAt: new Date(now).toISOString(),
    availableAt: new Date(now + HOLD_MS).toISOString(),
    ...meta,
  });
  const user = db.users?.[userId];
  if (user) user.earnings = (user.earnings ?? 0) + stars;
}

function pendingWithdrawalStars(db, userId) {
  return (db.withdrawalRequests ?? [])
    .filter((w) => w.userId === userId && w.status === "pending")
    .reduce((sum, w) => sum + (w.stars ?? 0), 0);
}

export function getWithdrawableStars(db, userId) {
  ensureEarningsLedger(db);
  const now = Date.now();
  let available = 0;
  for (const entry of db.earningsLedger[userId] ?? []) {
    if (new Date(entry.availableAt).getTime() > now) continue;
    available += Math.max(0, (entry.stars ?? 0) - (entry.withdrawn ?? 0));
  }
  return Math.max(0, available - pendingWithdrawalStars(db, userId));
}

export function getStarsLast21Days(db, userId) {
  ensureEarningsLedger(db);
  const cutoff = Date.now() - HOLD_MS;
  let total = 0;
  for (const entry of db.earningsLedger[userId] ?? []) {
    if (new Date(entry.createdAt).getTime() >= cutoff) {
      total += entry.stars ?? 0;
    }
  }
  return total;
}

export function consumeWithdrawable(db, userId, stars) {
  ensureEarningsLedger(db);
  const now = Date.now();
  let remaining = stars;
  for (const entry of db.earningsLedger[userId] ?? []) {
    if (remaining <= 0) break;
    if (new Date(entry.availableAt).getTime() > now) continue;
    const left = Math.max(0, (entry.stars ?? 0) - (entry.withdrawn ?? 0));
    if (left <= 0) continue;
    const take = Math.min(left, remaining);
    entry.withdrawn = (entry.withdrawn ?? 0) + take;
    remaining -= take;
  }
  if (remaining > 0) throw new Error("Insufficient withdrawable balance");
}

export function refundWithdrawal(db, userId, stars) {
  addEarningsCredit(db, userId, stars, "withdrawal_refund");
}

export function getWalletInfo(db, userId) {
  ensureEarningsLedger(db);
  const user = db.users?.[userId];
  const totalEarnings = user?.earnings ?? 0;
  const withdrawable = getWithdrawableStars(db, userId);
  const starsLast21Days = getStarsLast21Days(db, userId);
  const meetsMinimum = starsLast21Days >= MIN_STARS_21_DAYS;

  const transactions = [];
  for (const entry of db.earningsLedger[userId] ?? []) {
    transactions.push({
      id: entry.id,
      type: entry.type ?? "earning",
      amount: entry.stars,
      label: entry.label ?? formatLedgerLabel(entry),
      date: entry.createdAt,
      status: "completed",
      donorId: entry.donorId ?? null,
      donorName: entry.donorName ?? null,
      donorUsername: entry.donorUsername ?? null,
      postId: entry.postId ?? null,
    });
  }
  for (const w of db.withdrawalRequests ?? []) {
    if (w.userId !== userId) continue;
    transactions.push({
      id: w.id,
      type: "withdrawal",
      amount: -(w.stars ?? 0),
      label: `Withdrawal to TON wallet`,
      date: w.createdAt,
      status: w.status ?? "pending",
      hash: w.txHash,
    });
  }
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const stats = getCreatorStats(db, userId);

  return {
    totalEarnings,
    withdrawable,
    starsLast21Days,
    meetsMinimum,
    canWithdraw: meetsMinimum && withdrawable > 0,
    transactions,
    stats,
  };
}

function formatLedgerLabel(entry) {
  switch (entry.type) {
    case "donation": {
      if (entry.donorName) return `${entry.donorName} donated Stars`;
      return "Star donation received";
    }
    case "post_unlock": return "Paid post unlock";
    case "paid_media": return "Paid media unlock";
    case "withdrawal_refund": return "Withdrawal refund";
    default: return "Stars earned";
  }
}
