"use client";

import Link from "next/link";
import { GatedLink } from "@/components/telegram/GatedLink";
import { ArrowLeft, MessageCircle, Bell } from "lucide-react";
import { Logo } from "./Logo";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import { HeaderStars } from "@/components/ui/PremiumParticles";
import { usePrototype } from "@/lib/hooks/usePrototype";

interface HeaderProps {
  title?: string;
  hideActions?: boolean;
  backHref?: string;
}

export function Header({ title, hideActions, backHref }: HeaderProps) {
  const { state, clearChatUnread, clearNotificationUnread } = usePrototype();

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border safe-top relative">
      <HeaderStars />
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto relative">
        {title ? (
          <div className="flex items-center gap-2 min-w-0">
            {backHref && (
              <Link href={backHref} className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors shrink-0" aria-label="Back">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>
        ) : (
          <Logo />
        )}
        {!hideActions && (
          <div className="flex items-center gap-1">
            <GatedLink
              href="/chat/"
              onClick={clearChatUnread}
              className="relative p-2.5 rounded-full hover:bg-surface transition-colors"
              aria-label="Chat"
            >
              <MessageCircle className="w-5 h-5 text-text" />
              <NotificationBadge count={state.chatUnread} />
            </GatedLink>
            <GatedLink
              href="/notifications/"
              onClick={clearNotificationUnread}
              className="relative p-2.5 rounded-full hover:bg-surface transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-text" />
              <NotificationBadge count={state.notificationUnread} />
            </GatedLink>
          </div>
        )}
      </div>
    </header>
  );
}
