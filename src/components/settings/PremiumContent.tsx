"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Upload, Users, Sparkles } from "lucide-react";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { PremiumCelebration } from "@/components/premium/PremiumCelebration";
import { useAuth } from "@/lib/hooks/useAuth";
import { confirmDevPayment, createPremiumInvoice, openTelegramInvoice } from "@/lib/api/payments";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { useToast } from "@/components/ui/ToastProvider";
import { formatStars } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const PLANS = [
  { id: "1m", label: "1 Month", months: 1, stars: 100 },
  { id: "6m", label: "6 Months", months: 6, stars: 300, popular: true },
  { id: "1y", label: "1 Year", months: 12, stars: 500 },
] as const;

const FEATURES = [
  { icon: BadgeCheck, title: "Premium Verify Badge", desc: "Stand out with an exclusive premium badge on your profile." },
  { icon: Upload, title: "Larger uploads", desc: "Post media up to 1 GB instead of the 10 MB free limit." },
  { icon: Users, title: "Follower insights", desc: "View other users' followers and following lists." },
];

export function PremiumContent() {
  const { user, refresh, isAuthenticated } = useAuth();
  const { requireMiniApp } = useTelegramGate();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string>("6m");
  const [celebrating, setCelebrating] = useState(false);

  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[1];

  const handlePurchase = async () => {
    if (!requireMiniApp()) return;
    if (!isAuthenticated || !user) return;
    if (user.premium) {
      showToast("You already have Premium");
      return;
    }
    try {
      const invoice = await createPremiumInvoice(plan.id);
      if (invoice.dev || !invoice.invoiceUrl) {
        await confirmDevPayment(invoice.intentId);
        await refresh();
        setCelebrating(true);
        showToast(`Premium activated — ${plan.label}`);
        return;
      }
      const opened = openTelegramInvoice(invoice.invoiceUrl, async (status) => {
        if (status === "paid") {
          await refresh();
          setCelebrating(true);
          showToast(`Premium activated — ${plan.label}`);
        } else if (status === "failed") {
          showToast("Payment failed");
        }
      });
      if (!opened) showToast("Open in Telegram to pay with Stars");
    } catch {
      showToast("Payment failed");
    }
  };

  return (
    <div className="min-h-dvh pb-8">
      <PremiumCelebration active={celebrating} onDone={() => setCelebrating(false)} />

      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Premium</h1>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-4">
        <section className="premium-glass rounded-3xl p-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 premium-glass-shine pointer-events-none" aria-hidden />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl premium-icon-bg mb-3">
              <Sparkles className="w-7 h-7 text-[#a78bfa]" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent">
              Sheytoni Premium
            </h2>
            <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
              Unlock exclusive tools and stand out as a creator.
            </p>
            {user?.premium && (
              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium premium-badge-active">
                Active
              </span>
            )}
          </div>
        </section>

        <section className="premium-glass rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Choose plan</h3>
          </div>
          <div className="p-3 space-y-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left",
                  selected === p.id
                    ? "premium-plan-selected"
                    : "border-border/50 bg-surface/30 hover:bg-surface/50"
                )}
              >
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {p.label}
                    {"popular" in p && p.popular && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full premium-badge-active">Popular</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{p.months} month{p.months > 1 ? "s" : ""} subscription</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TelegramStarIcon variant="post" size={18} />
                  <span className="font-semibold tabular-nums">{formatStars(p.stars)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="premium-glass rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Premium features</h3>
          </div>
          <div className="divide-y divide-border/40">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 px-4 py-3.5">
                <div className="shrink-0 w-9 h-9 rounded-xl premium-icon-bg flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-[#818cf8]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handlePurchase}
          disabled={!!user?.premium}
          className="w-full py-3.5 rounded-full font-semibold text-sm text-white premium-cta disabled:opacity-50"
        >
          {user?.premium ? "Premium active" : `Get Premium · ${formatStars(plan.stars)} Stars`}
        </button>
      </div>
    </div>
  );
}
