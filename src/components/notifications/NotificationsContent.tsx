"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, MessageCircle, UserPlus } from "lucide-react";
import { mockNotifications } from "@/data/mock/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { FollowButton } from "@/components/ui/FollowButton";
import { formatTimeAgo, formatStars } from "@/lib/utils/format";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

function NotificationIcon({ type }: { type: AppNotification["type"] }) {
  switch (type) {
    case "follow": return <UserPlus className="w-4 h-4 text-[#8b5cf6]" />;
    case "like": return <Heart className="w-4 h-4 text-like" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-[#6366f1]" />;
    case "donation": return <TelegramStarIcon variant="donate" size={16} />;
  }
}

function NotificationText({ n }: { n: AppNotification }) {
  if (n.type === "like" && n.users && n.users.length > 0) {
    const names = n.users.map((u) => u.displayName).join(" and ");
    const extra = n.othersCount ? ` and ${n.othersCount} others` : "";
    return <span><strong>{names}{extra}</strong> liked your post</span>;
  }
  if (n.type === "donation" && n.user && n.stars) {
    return (
      <span>
        <strong>{n.user.displayName}</strong> donated{" "}
        <span className="inline-flex items-center gap-0.5 text-gold">
          <TelegramStarIcon variant="donate" size={12} />
          {formatStars(n.stars)}
        </span>{" "}
        to your post
      </span>
    );
  }
  if (n.user) {
    return <span><strong>{n.user.displayName}</strong> {n.text}</span>;
  }
  return <span>{n.text}</span>;
}

export function NotificationsContent() {
  const { clearNotificationUnread } = usePrototype();

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
        {mockNotifications.map((n) => (
          <div key={n.id} className="glass-nav rounded-2xl px-4 py-3.5 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0">
              <NotificationIcon type={n.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                {n.user && (
                  <Link href={`/profile/${n.user.username}/`} className="shrink-0">
                    <Avatar src={n.user.avatar} alt="" size="sm" />
                  </Link>
                )}
                {n.type === "like" && n.users && (
                  <div className="flex -space-x-2 shrink-0">
                    {n.users.slice(0, 2).map((u) => (
                      <Link key={u.id} href={`/profile/${u.username}/`}>
                        <Avatar src={u.avatar} alt="" size="sm" className="ring-2 ring-bg" />
                      </Link>
                    ))}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">
                    <NotificationText n={n} />
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                  {n.type === "follow" && n.user && (
                    <FollowButton userId={n.user.id} size="sm" className="mt-2" />
                  )}
                </div>
                {n.postThumbnail && (
                  <Link href="/" className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-surface">
                    <Image src={n.postThumbnail} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
