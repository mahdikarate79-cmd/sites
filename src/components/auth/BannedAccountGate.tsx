"use client";

import Link from "next/link";
import { ShieldBan } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function BannedAccountGate({ children }: { children: React.ReactNode }) {
  const { banned, bannedAt, loading } = useAuth();

  if (!loading && banned) {
    const when = bannedAt ? new Date(bannedAt).toLocaleString() : "—";
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#450a0a]/40 via-bg to-bg">
        <div className="w-full max-w-sm rounded-3xl border border-red-500/25 bg-red-950/30 backdrop-blur-xl p-8 text-center shadow-[0_0_60px_rgba(239,68,68,0.12)]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 mb-5">
            <ShieldBan className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-red-300 mb-2">Account banned</h1>
          <p className="text-sm text-red-200/80 leading-relaxed mb-1">
            Your account was suspended and you cannot use Sheytoni.
          </p>
          <p className="text-xs text-red-300/60 mb-6">
            Banned on {when}
          </p>
          <p className="text-sm text-text-muted mb-4">
            If you believe this is a mistake, contact our admin on Telegram:
          </p>
          <Link
            href="https://t.me/SheytoniAd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#229ED9]/20 border border-[#229ED9]/40 text-[#7dd3fc] font-medium text-sm hover:bg-[#229ED9]/30 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#229ED9]" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            t.me/SheytoniAd
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
