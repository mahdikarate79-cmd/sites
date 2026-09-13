"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { AuthUser, LoginMethod } from "@/lib/auth/types";
import {
  authenticateWithTelegram,
  deleteAuthAccount,
  fetchAuthMe,
  getTelegramInitData,
} from "@/lib/auth/client";
import { fetchUnlockedPosts } from "@/lib/api/payments";
import { clearLocalUserData, markUserDeleted } from "@/lib/auth/deletedUser";
import { isTelegramMiniApp } from "@/lib/telegram/miniApp";

interface AuthContextValue {
  user: AuthUser | null;
  loginMethod: LoginMethod;
  verificationMinFollowers: number;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
  accountDeleted: boolean;
  canRecreateAt: string | null;
  remainingMs: number | null;
  unlockedPostIds: string[];
  isPostUnlocked: (postId: string) => boolean;
  refresh: () => Promise<void>;
  refreshUnlocks: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("guest");
  const [verificationMinFollowers, setVerificationMinFollowers] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [canRecreateAt, setCanRecreateAt] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [unlockedPostIds, setUnlockedPostIds] = useState<string[]>([]);
  const lastTelegramId = useRef<number | null>(null);

  const applyMe = useCallback((data: {
    user: AuthUser | null;
    loginMethod: LoginMethod;
    verificationMinFollowers?: number;
    accountDeleted?: boolean;
    canRecreateAt?: string;
    remainingMs?: number;
  }) => {
    setUser(data.user);
    setLoginMethod(data.loginMethod);
    if (data.verificationMinFollowers) setVerificationMinFollowers(data.verificationMinFollowers);
    setAccountDeleted(!!data.accountDeleted);
    setCanRecreateAt(data.canRecreateAt ?? null);
    setRemainingMs(data.remainingMs ?? null);
  }, []);

  const refreshUnlocks = useCallback(async () => {
    try {
      const ids = await fetchUnlockedPosts();
      setUnlockedPostIds(ids);
    } catch {
      setUnlockedPostIds([]);
    }
  }, []);

  const authenticateTelegram = useCallback(async () => {
    const initData = getTelegramInitData();
    if (!initData) {
      applyMe({ user: null, loginMethod: "guest" });
      return;
    }

    let tgUser: { id?: number } = {};
    try {
      tgUser = JSON.parse(new URLSearchParams(initData).get("user") ?? "{}");
    } catch { /* ignore */ }

    if (tgUser.id && lastTelegramId.current && tgUser.id !== lastTelegramId.current) {
      clearLocalUserData(lastTelegramId.current ? `tg_${lastTelegramId.current}` : null);
    }

    try {
      const data = await authenticateWithTelegram(initData);
      applyMe(data);
      if (data.accountDeleted) {
        clearLocalUserData();
        lastTelegramId.current = tgUser.id ?? null;
        return;
      }
      if (data.user) {
        lastTelegramId.current = tgUser.id ?? null;
        await refreshUnlocks();
      } else {
        lastTelegramId.current = null;
      }
    } catch {
      applyMe({ user: null, loginMethod: "guest" });
    }
  }, [applyMe, refreshUnlocks]);

  const refresh = useCallback(async () => {
    if (isTelegramMiniApp()) {
      await authenticateTelegram();
      return;
    }
    try {
      const data = await fetchAuthMe();
      if (data.loginMethod === "telegram" && data.user) {
        applyMe(data);
        await refreshUnlocks();
      } else {
        applyMe({ user: null, loginMethod: "guest" });
      }
    } catch {
      applyMe({ user: null, loginMethod: "guest" });
    }
  }, [applyMe, authenticateTelegram, refreshUnlocks]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isTelegramMiniApp()) {
        await authenticateTelegram();
      } else {
        try {
          const data = await fetchAuthMe();
          applyMe(data.loginMethod === "telegram" && data.user ? data : { user: null, loginMethod: "guest" });
          if (data.user) await refreshUnlocks();
        } catch {
          applyMe({ user: null, loginMethod: "guest" });
        }
      }
      setLoading(false);
    })();
  }, [authenticateTelegram, applyMe, refreshUnlocks]);

  useEffect(() => {
    if (!isTelegramMiniApp()) return;

    const checkAccountSwitch = async () => {
      const initData = getTelegramInitData();
      if (!initData) return;
      try {
        const tgUser = JSON.parse(new URLSearchParams(initData).get("user") ?? "{}");
        if (tgUser.id && lastTelegramId.current && tgUser.id !== lastTelegramId.current) {
          clearLocalUserData(`tg_${lastTelegramId.current}`);
          await authenticateTelegram();
        }
      } catch { /* ignore */ }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        authenticateTelegram();
        checkAccountSwitch();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", authenticateTelegram);

    const interval = setInterval(() => {
      authenticateTelegram();
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", authenticateTelegram);
      clearInterval(interval);
    };
  }, [authenticateTelegram]);

  const deleteAccount = useCallback(async () => {
    const uid = user?.id;
    await deleteAuthAccount();
    if (uid) markUserDeleted(uid);
    clearLocalUserData(uid);
    setUser(null);
    setLoginMethod("guest");
    setUnlockedPostIds([]);
    lastTelegramId.current = null;
    if (isTelegramMiniApp()) {
      const initData = getTelegramInitData();
      if (initData) {
        const data = await authenticateWithTelegram(initData);
        applyMe(data);
      }
    }
  }, [user?.id, applyMe]);

  const isPostUnlocked = useCallback(
    (postId: string) => unlockedPostIds.includes(postId),
    [unlockedPostIds],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loginMethod,
        verificationMinFollowers,
        isAuthenticated: loginMethod === "telegram" && !!user,
        isGuest: loginMethod === "guest" || !user,
        loading,
        accountDeleted,
        canRecreateAt,
        remainingMs,
        unlockedPostIds,
        isPostUnlocked,
        refresh,
        refreshUnlocks,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
