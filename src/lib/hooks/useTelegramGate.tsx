"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { TelegramGateModal } from "@/components/telegram/TelegramGateModal";
import { useAuth } from "@/lib/hooks/useAuth";

interface TelegramGateContextValue {
  isMiniApp: boolean;
  requireMiniApp: () => boolean;
}

const TelegramGateContext = createContext<TelegramGateContextValue | null>(null);

export function TelegramGateProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const requireMiniApp = useCallback(() => {
    if (loading) return false;
    if (isAuthenticated) return true;
    setModalOpen(true);
    return false;
  }, [isAuthenticated, loading]);

  return (
    <TelegramGateContext.Provider value={{ isMiniApp: isAuthenticated, requireMiniApp }}>
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
