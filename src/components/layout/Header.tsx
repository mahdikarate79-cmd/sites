"use client";

import Link from "next/link";
import { MessageCircle, Bell, Sun, Moon } from "lucide-react";
import { Logo } from "./Logo";
import { withBasePath } from "@/lib/hooks/useBasePath";
import { useTheme } from "@/lib/hooks/useTheme";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        {title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : (
          <Logo />
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-surface transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-text" />
            ) : (
              <Moon className="w-5 h-5 text-text" />
            )}
          </button>
          <Link
            href={withBasePath("/chat")}
            className="p-2.5 rounded-full hover:bg-surface transition-colors"
            aria-label="Chat"
          >
            <MessageCircle className="w-5 h-5 text-text" />
          </Link>
          <button
            className="p-2.5 rounded-full hover:bg-surface transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-text" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-like rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
