"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { fetchNotifications } from "@/lib/api/notifications";
import { getChats } from "@/lib/api/chat";

/** Polls server for unread notification + chat counts */
export function BadgeSync() {
  const { isAuthenticated } = useAuth();
  const { setNotificationUnread, setChatUnread } = usePrototype();

  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationUnread(0);
      setChatUnread(0);
      return;
    }

    const sync = async () => {
      try {
        const { unreadCount } = await fetchNotifications();
        setNotificationUnread(unreadCount);
      } catch { /* ignore */ }

      try {
        const chats = await getChats();
        const unread = chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
        setChatUnread(unread);
      } catch { /* ignore */ }
    };

    sync();
    const interval = setInterval(sync, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setNotificationUnread, setChatUnread]);

  return null;
}
