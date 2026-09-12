"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Monitor,
  Sun,
  Moon,
  Crown,
  Bookmark,
  Clapperboard,
  HelpCircle,
  Shield,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { formatCount } from "@/lib/utils/format";
import { useTheme, type Theme } from "@/lib/hooks/useTheme";
import { cn } from "@/lib/utils/cn";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Monitor }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const LINK_ITEMS = [
  { href: "/settings/premium/", label: "Premium", icon: Crown, description: "Unlock exclusive features" },
  { href: "/settings/bookmarks/", label: "Bookmarks", icon: Bookmark, description: "Saved posts and reels" },
  { href: "/creator-studio/", label: "Creator Studio", icon: Clapperboard, description: "Earnings and analytics" },
  { href: "/settings/help/", label: "Help", icon: HelpCircle, description: "Support and FAQ" },
  { href: "/settings/privacy/", label: "Privacy", icon: Shield, description: "Privacy and security" },
];

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { getCurrentUser } = usePrototype();
  const currentUser = getCurrentUser();

  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/profile/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back to profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <section className="glass-nav rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Account</h2>
          </div>
          <Link href="/profile/" className="flex items-center gap-3 px-4 py-4 hover:bg-surface/50 transition-colors">
            <Avatar src={currentUser.avatar} alt={currentUser.displayName} size="lg" />
            <div className="flex-1 min-w-0">
              <UserName user={currentUser} nameClassName="font-semibold" />
              <p className="text-sm text-text-muted truncate">@{currentUser.username}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
          </Link>
          <div className="flex justify-around px-4 py-3 border-t border-border text-center text-sm">
            <Link href="/settings/following/" className="hover:opacity-80 transition-opacity">
              <p className="font-semibold">{formatCount(currentUser.following)}</p>
              <p className="text-text-muted text-xs">Following</p>
            </Link>
            <Link href="/settings/followers/" className="hover:opacity-80 transition-opacity">
              <p className="font-semibold">{formatCount(currentUser.followers)}</p>
              <p className="text-text-muted text-xs">Followers</p>
            </Link>
            <div>
              <p className="font-semibold">{formatCount(currentUser.postsCount)}</p>
              <p className="text-text-muted text-xs">Posts</p>
            </div>
          </div>
          <Link
            href="/settings/edit-profile/"
            className="flex items-center gap-3 px-4 py-3.5 border-t border-border hover:bg-surface/50 transition-colors"
          >
            <User className="w-5 h-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium">Edit profile</span>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </Link>
        </section>

        <section className="glass-nav rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Appearance</h2>
          </div>
          <div className="divide-y divide-border">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-surface/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-text-muted" />
                <span className="flex-1 text-sm font-medium">{label}</span>
                <span
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    theme === value ? "border-text" : "border-border"
                  )}
                >
                  {theme === value && <span className="w-2.5 h-2.5 rounded-full bg-text" />}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="glass-nav rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">More</h2>
          </div>
          <div className="divide-y divide-border">
            {LINK_ITEMS.map(({ href, label, icon: Icon, description }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-text-muted truncate">{description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
