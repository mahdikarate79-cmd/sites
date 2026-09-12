"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { AuthUser, LoginMethod } from "@/lib/auth/types";
import {
  authenticateWithTelegram,
  deleteAuthAccount,
  fetchAuthMe,
  getTelegramInitData,
  logoutAuth,
} from "@/lib/auth/client";
import { clearLocalUserData, markUserDeleted } from "@/lib/auth/deletedUser";
import { isTelegramMiniApp } from "@/lib/telegram/miniApp";

interface AuthContextValue {
  user: AuthUser | null;
  loginMethod: LoginMethod;
  verificationMinFollowers: number;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("guest");
  const [verificationMinFollowers, setVerificationMinFollowers] = useState(10000);
  const [loading, setLoading] = useState(true);
  const lastTelegramId = useRef<number | null>(null);

  const applyMe = useCallback((data: { user: AuthUser | null; loginMethod: LoginMethod; verificationMinFollowers?: number }) => {
    setUser(data.user);
    setLoginMethod(data.loginMethod);
    if (data.verificationMinFollowers) setVerificationMinFollowers(data.verificationMinFollowers);
  }, []);

  const authenticateTelegram = useCallback(async () => {
    const initData = getTelegramInitData();
    if (!initData) {
      applyMe({ user: null, loginMethod: "guest" });
      return;
    }

    try {
      const data = await authenticateWithTelegram(initData);
      applyMe(data);
      if (data.user) {
        const tgUser = JSON.parse(new URLSearchParams(initData).get("user") ?? "{}");
        lastTelegramId.current = tgUser.id ?? null;
      }
    } catch {
      applyMe({ user: null, loginMethod: "guest" });
    }
  }, [applyMe]);

  const refresh = useCallback(async () => {
    if (isTelegramMiniApp()) {
      await authenticateTelegram();
      return;
    }
    try {
      const data = await fetchAuthMe();
      if (data.loginMethod === "telegram" && data.user) {
        applyMe(data);
      } else {
        applyMe({ user: null, loginMethod: "guest" });
      }
    } catch {
      applyMe({ user: null, loginMethod: "guest" });
    }
  }, [applyMe, authenticateTelegram]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isTelegramMiniApp()) {
        await authenticateTelegram();
      } else {
        try {
          const data = await fetchAuthMe();
          applyMe(data.loginMethod === "telegram" && data.user ? data : { user: null, loginMethod: "guest" });
        } catch {
          applyMe({ user: null, loginMethod: "guest" });
        }
      }
      setLoading(false);
    })();
  }, [authenticateTelegram, applyMe]);

  useEffect(() => {
    if (!isTelegramMiniApp()) return;

    const checkAccountSwitch = async () => {
      const initData = getTelegramInitData();
      if (!initData) return;
      try {
        const tgUser = JSON.parse(new URLSearchParams(initData).get("user") ?? "{}");
        if (tgUser.id && lastTelegramId.current && tgUser.id !== lastTelegramId.current) {
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

  const logout = useCallback(async () => {
    try {
      await logoutAuth();
    } catch { /* ignore */ }
    setUser(null);
    setLoginMethod("guest");
    lastTelegramId.current = null;
  }, []);

  const deleteAccount = useCallback(async () => {
    const uid = user?.id;
    await deleteAuthAccount();
    if (uid) markUserDeleted(uid);
    clearLocalUserData();
    setUser(null);
    setLoginMethod("guest");
    lastTelegramId.current = null;
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loginMethod,
        verificationMinFollowers,
        isAuthenticated: loginMethod === "telegram" && !!user,
        isGuest: loginMethod === "guest" || !user,
        loading,
        refresh,
        logout,
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
