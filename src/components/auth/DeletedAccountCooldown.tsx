"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

function formatRemaining(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function DeletedAccountCooldown() {
  const { accountDeleted, remainingMs, canRecreateAt } = useAuth();
  const [left, setLeft] = useState(remainingMs ?? 0);

  useEffect(() => {
    if (!accountDeleted || !canRecreateAt) return;
    const tick = () => {
      const ms = new Date(canRecreateAt).getTime() - Date.now();
      setLeft(Math.max(0, ms));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [accountDeleted, canRecreateAt]);

  if (!accountDeleted || left <= 0) return null;

  return (
    <div className="mx-4 mt-4 max-w-2xl rounded-2xl border border-like/30 bg-like/10 px-4 py-4 text-center">
      <p className="text-sm font-semibold text-like mb-1">Account deleted</p>
      <p className="text-xs text-text-muted leading-relaxed">
        You can create a new Sheytoni account in{" "}
        <span className="font-semibold text-text tabular-nums">{formatRemaining(left)}</span>
      </p>
      <p className="text-[10px] text-text-muted mt-2">Your previous username cannot be reused.</p>
    </div>
  );
}
