"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Users, Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { useToast } from "@/components/ui/ToastProvider";
import { submitVerificationRequest } from "@/lib/api/verification";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function VerificationContent() {
  const { user, refresh, isAuthenticated, verificationMinFollowers } = useAuth();
  const { requireMiniApp } = useTelegramGate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const minFollowers = verificationMinFollowers;
  const followers = user?.followers ?? 0;
  const meetsFollowers = followers >= minFollowers;
  const isVerified = user?.verified;
  const isPending = user?.verificationRequestPending;
  const locked = isVerified || isPending;

  const handleSubmit = async () => {
    if (!requireMiniApp() || !isAuthenticated) return;
    if (locked) return;
    if (!meetsFollowers) {
      showToast(`You need at least ${formatCount(minFollowers)} followers`);
      return;
    }
    setLoading(true);
    try {
      await submitVerificationRequest();
      await refresh();
      showToast("Verification request sent");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh pb-8">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Verification</h1>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-4">
        <section className="glass-nav rounded-2xl p-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2AABEE]/15 mb-3">
            <BadgeCheck className="w-7 h-7 text-[#2AABEE]" />
          </div>
          <h2 className="text-lg font-bold text-[#2AABEE]">Official Verification</h2>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            Get the official blue badge to show you are a recognized and active creator on Sheytoni.
          </p>
        </section>

        <section className="glass-nav rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Requirements</h3>
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <Users className="w-4 h-4 mt-0.5 shrink-0 text-[#2AABEE]" />
              At least <strong className="text-text">{formatCount(minFollowers)}</strong> followers
              {meetsFollowers ? " ✓" : ` (${formatCount(followers)} now)`}
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-[#2AABEE]" />
              Active and well-known presence on the platform
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 shrink-0 text-[#2AABEE]" />
              Authentic identity — no impersonation or spam
            </li>
          </ul>
          <p className="text-xs text-text-muted pt-1">
            If you change your display name after verification, your official badge will be removed and you must request again.
          </p>
        </section>

        {isVerified && (
          <div className="rounded-2xl border border-[#2AABEE]/30 bg-[#2AABEE]/10 px-4 py-3 text-sm text-[#2AABEE] text-center font-medium">
            You have official verification
          </div>
        )}

        {isPending && !isVerified && (
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted text-center">
            Your request is under review. You cannot submit another request until it is resolved.
          </div>
        )}

        <button
          type="button"
          disabled={locked || loading || !meetsFollowers}
          onClick={handleSubmit}
          className={cn(
            "w-full py-3.5 rounded-full text-sm font-semibold transition-colors",
            locked || !meetsFollowers
              ? "bg-surface text-text-muted cursor-not-allowed"
              : "bg-gradient-to-r from-[#2AABEE] to-[#229ED9] text-white shadow-lg shadow-[#229ED9]/20"
          )}
        >
          {isVerified ? "Verified" : isPending ? "Request pending" : loading ? "Sending…" : "Submit request"}
        </button>
      </div>
    </div>
  );
}
