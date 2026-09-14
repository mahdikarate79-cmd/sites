"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Heart,
  Users,
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatCount, formatStars } from "@/lib/utils/format";
import { starsToUsd, formatUsd } from "@/lib/constants/stars";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchWallet, requestWithdrawal, WalletInfo } from "@/lib/api/wallet";
import { TransactionRecord, User } from "@/lib/types";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { cn } from "@/lib/utils/cn";

const WITHDRAWAL_MIN_STARS = 1000;

function isValidTonWallet(address: string): boolean {
  const trimmed = address.trim();
  return /^(UQ|EQ)[A-Za-z0-9_-]{46,48}$/.test(trimmed);
}

export function CreatorStudioContent() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [amountInput, setAmountInput] = useState("1000");
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchWallet()
      .then(setWallet)
      .catch(() => setWallet(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const available = wallet?.withdrawable ?? 0;
  const totalEarnings = wallet?.totalEarnings ?? 0;
  const starsLast21Days = wallet?.starsLast21Days ?? 0;
  const meetsMinimum = wallet?.meetsMinimum ?? false;
  const canWithdraw = wallet?.canWithdraw ?? false;
  const transactions = wallet?.transactions ?? [];

  const amount = Math.max(0, parseInt(amountInput, 10) || 0);
  const usd = starsToUsd(amount);
  const walletValid = walletAddress.trim() ? isValidTonWallet(walletAddress) : false;
  const amountValid = amount >= 1 && amount <= available;
  const canSubmitWithdraw = meetsMinimum && walletValid && amountValid && !submitting;

  const handleAmountChange = (value: string) => {
    if (value === "") {
      setAmountInput("");
      return;
    }
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (Number.isNaN(num)) return;
    setAmountInput(String(Math.min(available, Math.max(0, num))));
  };

  const handleWithdraw = async () => {
    if (!walletValid || !amountValid || submitting) return;
    setSubmitting(true);
    try {
      await requestWithdrawal(amount, walletAddress.trim());
      showToast("Withdrawal request submitted");
      setWithdrawOpen(false);
      setWalletAddress("");
      setAmountInput("1000");
      const updated = await fetchWallet();
      setWallet(updated);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = wallet?.stats;
  const statCards = [
    { label: "Views", value: formatCount(stats?.views ?? 0), icon: Eye },
    { label: "Likes", value: formatCount(stats?.likes ?? 0), icon: Heart },
    { label: "Followers", value: formatCount(stats?.followers ?? user?.followers ?? 0), icon: Users },
    { label: "Posts", value: formatCount(stats?.posts ?? 0), icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-muted text-sm">
        Loading wallet…
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back to settings">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Creator Studio</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-nav rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-text-muted" />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <section className="glass-nav rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Stars earned</p>
            <TelegramStarIcon size={18} />
          </div>
          <p className="text-2xl font-bold mb-1 tabular-nums">{formatStars(totalEarnings)}</p>
          <p className="text-xs text-text-muted mb-0.5">
            {formatStars(available)} available to withdraw
          </p>
          <p className="text-xs text-text-muted">
            {formatStars(starsLast21Days)} stars earned in the last 21 days
          </p>
          <button
            type="button"
            disabled={!canWithdraw}
            onClick={() => setWithdrawOpen(true)}
            className={cn(
              "flex items-center justify-center gap-2 w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity",
              canWithdraw
                ? "bg-text text-bg hover:opacity-90"
                : "bg-surface text-text-muted cursor-not-allowed opacity-60"
            )}
          >
            <Wallet className="w-4 h-4" />
            Withdraw
          </button>
          {!meetsMinimum && (
            <p className="text-xs text-text-muted text-center mt-2">
              Minimum {formatStars(WITHDRAWAL_MIN_STARS)} stars earned in the last 21 days required
            </p>
          )}
          {meetsMinimum && available <= 0 && totalEarnings > 0 && (
            <p className="text-xs text-text-muted text-center mt-2">
              Stars become withdrawable 21 days after they are received
            </p>
          )}
        </section>

        <section className="glass-nav rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Transactions</h2>
          </div>
          <div className="divide-y divide-border">
            {transactions.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-8">No transactions yet</p>
            ) : transactions.map((tx) => {
              const { id, label, amount: txAmount, date, donorId, donorName, donorUsername } = tx;
              const isCredit = txAmount > 0;
              const donorUser: User | null = donorId && donorName ? {
                id: donorId,
                displayName: donorName,
                username: donorUsername ?? undefined,
                avatar: "",
                verified: false,
                premium: false,
                followers: 0,
                following: 0,
                postsCount: 0,
              } : null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-surface/40 transition-colors"
                >
                  {donorUser ? (
                    <ProfileLink user={donorUser} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Avatar src={donorUser.avatar} alt="" size="sm" />
                    </ProfileLink>
                  ) : (
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        isCredit ? "bg-green-500/15" : "bg-like/15"
                      )}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-like" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {donorUser ? (
                        <ProfileLink user={donorUser} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          <UserName user={donorUser} nameClassName="text-sm font-medium" />
                        </ProfileLink>
                      ) : label}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn("text-sm font-semibold tabular-nums", isCredit ? "text-green-500" : "text-like")}>
                      {isCredit ? "+" : ""}{formatStars(txAmount)}
                    </span>
                    <TelegramStarIcon size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <Modal open={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (
          <div className="px-4 py-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Type</span><span className="capitalize">{selectedTx.type.replace("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className={cn("tabular-nums font-semibold", selectedTx.amount > 0 ? "text-green-500" : "text-like")}>{selectedTx.amount > 0 ? "+" : ""}{formatStars(selectedTx.amount)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Status</span><span className="capitalize">{selectedTx.status ?? "completed"}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Date</span><span>{new Date(selectedTx.date).toLocaleString("en-US")}</span></div>
            {selectedTx.hash && <div className="flex justify-between gap-4"><span className="text-text-muted shrink-0">Hash</span><span className="font-mono text-xs truncate">{selectedTx.hash}</span></div>}
            {selectedTx.donorName && (
              <div className="flex justify-between gap-4">
                <span className="text-text-muted shrink-0">From</span>
                {selectedTx.donorId ? (
                  <ProfileLink
                    user={{
                      id: selectedTx.donorId,
                      username: selectedTx.donorUsername ?? undefined,
                    }}
                    className="hover:underline text-right"
                  >
                    {selectedTx.donorName}
                  </ProfileLink>
                ) : (
                  <span>{selectedTx.donorName}</span>
                )}
              </div>
            )}
            <p className="text-text-muted text-xs pt-2 border-t border-border">{selectedTx.label}</p>
          </div>
        )}
      </Modal>

      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Earnings">
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Available</span>
            <span className="flex items-center gap-1 font-semibold tabular-nums">
              <TelegramStarIcon variant="post" size={16} />
              {formatStars(available)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Amount</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#8b5cf6]/40 bg-surface/50">
              <TelegramStarIcon variant="post" size={24} />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="flex-1 text-xl font-medium outline-none bg-transparent min-w-0 tabular-nums font-sans"
                style={{ fontVariantNumeric: "lining-nums" }}
                aria-label="Withdrawal amount"
              />
              <span className="text-sm text-text-muted shrink-0 tabular-nums">≈ {formatUsd(usd)}</span>
            </div>
            {amount > available && (
              <p className="text-xs text-like mt-1">Maximum available is {formatStars(available)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Wallet</label>
            <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface border border-border">
              <div className="w-5 h-5 rounded-full bg-[#0098EA] flex items-center justify-center text-white text-[7px] font-bold shrink-0" aria-hidden>
                TON
              </div>
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="TON Wallet Address"
                className="flex-1 text-sm outline-none bg-transparent font-mono min-w-0"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs text-text-muted">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Do not use an exchange wallet address.</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Do not include a memo or comment with your wallet.</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Enter a valid TON wallet address (UQ... or EQ...).</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!canSubmitWithdraw}
            className="w-full py-2.5 rounded-xl bg-text text-bg text-sm font-semibold disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Withdraw"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
