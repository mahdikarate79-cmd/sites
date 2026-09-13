"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BadgeCheck, AlertCircle, Info } from "lucide-react";
import { fetchNotifications, ServerNotification } from "@/lib/api/notifications";
import { formatTimeAgo } from "@/lib/utils/format";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";

function NotificationIcon({ type, icon }: { type: string; icon?: string }) {
  if (icon === "verified" || type.includes("verification")) {
    return <BadgeCheck className="w-4 h-4 text-[#2AABEE]" />;
  }
  if (icon === "removed" || type.includes("rejected")) {
    return <AlertCircle className="w-4 h-4 text-like" />;
  }
  if (type === "admin") return <Bell className="w-4 h-4 text-[#8b5cf6]" />;
  return <Info className="w-4 h-4 text-text-muted" />;
}

export function NotificationsContent() {
  const { clearNotificationUnread } = usePrototype();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<ServerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    fetchNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 glass-nav mx-3 mt-3 rounded-2xl safe-top">
        <div className="flex items-center gap-3 px-3 h-12">
          <Link href="/" onClick={clearNotificationUnread} className="p-2 -ml-1 rounded-full hover:bg-surface/60 transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-semibold">Notifications</h1>
        </div>
      </div>

      <div className="px-3 pt-3 space-y-2 max-w-2xl mx-auto">
        {loading && (
          <p className="text-center text-text-muted py-12 text-sm">Loading…</p>
        )}
        {!loading && notifications.length === 0 && (
          <p className="text-center text-text-muted py-12 text-sm">No notifications yet</p>
        )}
        {notifications.map((n) => (
          <div key={n.id} className="glass-nav rounded-2xl px-4 py-3.5 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0">
              <NotificationIcon type={n.type} icon={n.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-xs text-text-muted mt-1">{formatTimeAgo(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
