"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatCount, formatStars } from "@/lib/utils/format";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils/cn";

const STATS = {
  views: 2_450_000,
  likes: 89_000,
  followers: 12_400,
  engagement: 4.2,
};

const STARS_LAST_21_DAYS = 1_250;
const STARS_EARNED_TOTAL = 8_420;

interface Transaction {
  id: string;
  label: string;
  amount: number;
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: "t1", label: "Donation from @alex", amount: 150, date: "2026-09-10T14:30:00Z" },
  { id: "t2", label: "Donation from @sara", amount: 75, date: "2026-09-09T09:15:00Z" },
  { id: "t3", label: "Withdrawal to TON wallet", amount: -500, date: "2026-09-05T18:00:00Z" },
  { id: "t4", label: "Donation from @mmd", amount: 200, date: "2026-09-03T11:45:00Z" },
  { id: "t5", label: "Premium subscription", amount: -25, date: "2026-09-01T08:00:00Z" },
  { id: "t6", label: "Donation from @nika", amount: 320, date: "2026-08-28T16:20:00Z" },
];

const WITHDRAWAL_MIN_STARS = 1000;

export function CreatorStudioContent() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const { showToast } = useToast();

  const canWithdraw = STARS_LAST_21_DAYS >= WITHDRAWAL_MIN_STARS;

  const handleWithdraw = () => {
    if (!walletAddress.trim()) {
      showToast("Enter your TON wallet address");
      return;
    }
    showToast("Withdrawal request submitted");
    setWithdrawOpen(false);
    setWalletAddress("");
  };

  const statCards = [
    { label: "Views", value: formatCount(STATS.views), icon: Eye },
    { label: "Likes", value: formatCount(STATS.likes), icon: Heart },
    { label: "Followers", value: formatCount(STATS.followers), icon: Users },
    { label: "Engagement", value: `${STATS.engagement}%`, icon: TrendingUp },
  ];

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
          <p className="text-2xl font-bold mb-1">{formatStars(STARS_EARNED_TOTAL)}</p>
          <p className="text-xs text-text-muted">
            {formatStars(STARS_LAST_21_DAYS)} stars in the last 21 days
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
          {!canWithdraw && (
            <p className="text-xs text-text-muted text-center mt-2">
              Minimum {formatStars(WITHDRAWAL_MIN_STARS)} stars in 21 days required
            </p>
          )}
        </section>

        <section className="glass-nav rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Transactions</h2>
          </div>
          <div className="divide-y divide-border">
            {TRANSACTIONS.map(({ id, label, amount, date }) => {
              const isCredit = amount > 0;
              return (
                <div key={id} className="flex items-center gap-3 px-4 py-3.5">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
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
                      {isCredit ? "+" : ""}{formatStars(amount)}
                    </span>
                    <TelegramStarIcon size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw to TON">
        <div className="px-4 py-4 space-y-4">
          <p className="text-sm text-text-muted">
            Withdraw {formatStars(STARS_LAST_21_DAYS)} stars to your TON wallet. Funds typically arrive within 24 hours.
          </p>
          <div>
            <label htmlFor="tonWallet" className="block text-xs font-medium text-text-muted mb-1.5">
              TON wallet address
            </label>
            <input
              id="tonWallet"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="UQ... or EQ..."
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none focus:border-text-muted transition-colors font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleWithdraw}
            className="w-full py-2.5 rounded-xl bg-text text-bg text-sm font-semibold"
          >
            Confirm withdrawal
          </button>
        </div>
      </Modal>
    </div>
  );
}
