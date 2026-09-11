"use client";

import Link from "next/link";
import { MessageCircle, Bell } from "lucide-react";
import { Logo } from "./Logo";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import { HeaderStars } from "@/components/ui/PremiumParticles";
import { usePrototype } from "@/lib/hooks/usePrototype";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { state, clearChatUnread, clearNotificationUnread } = usePrototype();

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border safe-top relative">
      <HeaderStars />
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto relative">
        {title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : (
          <Logo />
        )}
        <div className="flex items-center gap-1">
          <Link
            href="/chat/"
            onClick={clearChatUnread}
            className="relative p-2.5 rounded-full hover:bg-surface transition-colors"
            aria-label="Chat"
          >
            <MessageCircle className="w-5 h-5 text-text" />
            <NotificationBadge count={state.chatUnread} />
          </Link>
          <button
            onClick={clearNotificationUnread}
            className="relative p-2.5 rounded-full hover:bg-surface transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-text" />
            <NotificationBadge count={state.notificationUnread} />
          </button>
        </div>
      </div>
    </header>
  );
}
