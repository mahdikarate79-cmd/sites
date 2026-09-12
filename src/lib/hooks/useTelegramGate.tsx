"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { TelegramGateModal } from "@/components/telegram/TelegramGateModal";
import { isTelegramMiniApp } from "@/lib/telegram/miniApp";

interface TelegramGateContextValue {
  isMiniApp: boolean;
  requireMiniApp: () => boolean;
}

const TelegramGateContext = createContext<TelegramGateContextValue | null>(null);

export function TelegramGateProvider({ children }: { children: ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIsMiniApp(isTelegramMiniApp());
  }, []);

  const requireMiniApp = useCallback(() => {
    if (isMiniApp) return true;
    setModalOpen(true);
    return false;
  }, [isMiniApp]);

  return (
    <TelegramGateContext.Provider value={{ isMiniApp, requireMiniApp }}>
      {children}
      <TelegramGateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </TelegramGateContext.Provider>
  );
}

export function useTelegramGate() {
  const ctx = useContext(TelegramGateContext);
  if (!ctx) throw new Error("useTelegramGate must be used within TelegramGateProvider");
  return ctx;
}
