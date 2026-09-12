"use client";

import Link from "next/link";
import { ArrowLeft, Rocket, User, FileText, MessageCircle, Star, Wallet, Shield } from "lucide-react";

const SECTIONS = [
  {
    icon: Rocket,
    title: "Getting Started",
    content: [
      "Sheytoni combines a social feed, short-form Reels, and private messaging in one place.",
      "Use the bottom navigation to switch between Home, Search, Create Post, and your Profile.",
      "Tap a post to like, comment, donate Stars, or share with friends.",
      "Swipe through Reels vertically for quick video discovery.",
    ],
  },
  {
    icon: User,
    title: "Account & Profile",
    content: [
      "Edit your display name, bio, avatar, and cover from Settings → Edit Profile.",
      "Verification badges show Official (blue) and Premium (purple) status.",
      "Follower and following counts are visible to everyone; only you can view your follower lists.",
      "Block users from their profile or from a chat conversation menu.",
    ],
  },
  {
    icon: FileText,
    title: "Posts & Reels",
    content: [
      "Create posts with text, images, or video from the + button in the bottom nav.",
      "Support creators by sending Telegram Stars on posts you enjoy.",
      "Bookmark posts to save them for later in your profile.",
      "Reels play in full-screen with smooth vertical transitions between videos.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Messages & Media",
    content: [
      "Send text, photos, albums, and GIFs in private chats.",
      "Paid media requires Stars to unlock — the sender sees a price badge, the receiver sees a locked preview.",
      "Temporary media supports 3s, 10s, 30s timers and view-once mode.",
      "Tap any photo to open it full-screen with reply, forward, and save options.",
      "Pin important messages for yourself or both participants.",
    ],
  },
  {
    icon: Star,
    title: "Stars & Donations",
    content: [
      "Stars are Sheytoni's virtual currency for supporting creators.",
      "Donate Stars on posts or unlock paid media in chats.",
      "Your Stars balance is shown in the header and Settings.",
      "All transactions are recorded in your transaction history.",
    ],
  },
  {
    icon: Wallet,
    title: "Creator Earnings",
    content: [
      "Creators earn Stars from donations and paid media unlocks.",
      "View your earnings and analytics in Creator Studio.",
      "Withdraw earnings to your connected TON wallet when available.",
      "Transaction history shows all incoming and outgoing Star activity.",
    ],
  },
  {
    icon: Shield,
    title: "Security & Safety",
    content: [
      "Report inappropriate content or accounts from any profile or post.",
      "Block users to prevent them from messaging you or seeing your activity.",
      "Review your privacy settings to control who can interact with you.",
      "Never share your password or verification codes with anyone.",
    ],
  },
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

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <p className="text-sm text-text-muted leading-relaxed">
          Everything you need to know about using Sheytoni. Browse the topics below for quick answers.
        </p>

        {SECTIONS.map(({ icon: Icon, title, content }) => (
          <section key={title} className="glass-nav rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Icon className="w-5 h-5 text-text-muted shrink-0" />
              <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            <ul className="space-y-2">
              {content.map((line) => (
                <li key={line} className="text-xs text-text-muted leading-relaxed pl-3 border-l-2 border-border">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-xs text-text-muted text-center pt-2">
          Need more help? Contact support at help@sheytoni.app
        </p>
      </div>
    </div>
  );
}
