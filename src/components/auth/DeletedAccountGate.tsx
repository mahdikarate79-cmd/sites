"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { DeletedAccountCooldown } from "./DeletedAccountCooldown";

export function DeletedAccountGate({ children }: { children: React.ReactNode }) {
  const { accountDeleted, loading, remainingMs, refresh } = useAuth();

  useEffect(() => {
    if (!accountDeleted || loading) return;
    if (remainingMs !== null && remainingMs <= 0) {
      refresh();
    }
  }, [accountDeleted, remainingMs, loading, refresh]);

  if (!loading && accountDeleted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <DeletedAccountCooldown />
        <p className="text-sm text-text-muted text-center mt-6 max-w-sm leading-relaxed">
          Your Sheytoni account was deleted. After the cooldown ends, a new account will be created automatically when you reopen the app.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
