"use client";

import { useEffect } from "react";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";

interface MiniAppGuardProps {
  children: React.ReactNode;
}

/** Shows Telegram gate modal on mount when outside the Mini App. */
export function MiniAppGuard({ children }: MiniAppGuardProps) {
  const { isMiniApp, requireMiniApp } = useTelegramGate();

  useEffect(() => {
    if (!isMiniApp) requireMiniApp();
  }, [isMiniApp, requireMiniApp]);

  return <>{children}</>;
}
