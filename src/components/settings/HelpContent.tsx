"use client";

import Link from "next/link";
import { ArrowLeft, Rocket, User, FileText, MessageCircle, Star, Shield, Wallet, ChevronRight } from "lucide-react";

const SECTIONS = [
  { icon: Rocket, title: "Getting Started", description: "Learn the basics of Sheytoni" },
  { icon: User, title: "Account", description: "Profile, verification, and settings" },
  { icon: FileText, title: "Posts", description: "Creating and sharing content" },
  { icon: MessageCircle, title: "Messages", description: "Chat, media, and privacy" },
  { icon: Star, title: "Stars & Donations", description: "Supporting creators with Stars" },
  { icon: Wallet, title: "Creator Earnings", description: "Withdrawals and analytics" },
  { icon: Shield, title: "Security", description: "Keeping your account safe" },
];

export function HelpContent() {
  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Help</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2 max-w-2xl mx-auto">
        {SECTIONS.map(({ icon: Icon, title, description }) => (
          <button
            key={title}
            type="button"
            className="flex items-center gap-3 w-full glass-nav rounded-2xl px-4 py-4 text-left hover:bg-surface/40 transition-colors"
          >
            <Icon className="w-5 h-5 text-text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
