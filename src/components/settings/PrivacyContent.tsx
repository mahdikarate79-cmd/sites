"use client";

import Link from "next/link";
import { ArrowLeft, User, MessageCircle, Ban, Image, Database, Shield } from "lucide-react";

const SECTIONS = [
  {
    icon: User,
    title: "Account Privacy",
    content: [
      "Your display name, avatar, and bio are visible to all Sheytoni users.",
      "Post count and follower/following numbers are public; follower lists are private to you.",
      "Verification status (Official or Premium) is shown on your profile and next to your name.",
      "You can hide specific posts from your profile by deleting them.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Messages",
    content: [
      "Only people you have an active conversation with can send you direct messages.",
      "Blocked users cannot message you or start new conversations.",
      "Paid and temporary media in chats have additional privacy protections.",
      "Pinned messages are visible based on the pin scope (for you or both).",
    ],
  },
  {
    icon: Ban,
    title: "Blocked Users",
    content: [
      "Blocked users cannot see your posts, send messages, or follow you.",
      "You can block or unblock users from their profile or chat menu.",
      "Blocking is reversible at any time from Settings.",
      "Blocked users are not notified when you block them.",
    ],
  },
  {
    icon: Image,
    title: "Media Privacy",
    content: [
      "Paid media is locked until the recipient pays with Stars — previews are blurred.",
      "Temporary media (timed or view-once) cannot be saved, forwarded, or screenshotted in the app.",
      "View-once photos expire when the viewer closes the full-screen preview.",
      "Timed media (3s, 10s, 30s) starts counting when first opened and deletes after the timer ends.",
    ],
  },
  {
    icon: Database,
    title: "Your Data",
    content: [
      "Sheytoni stores your profile, posts, messages, and preferences to provide the service.",
      "Prototype data is saved locally in your browser for testing purposes.",
      "You can clear local data by resetting your browser storage.",
      "A full data export feature will be available in a future release.",
    ],
  },
  {
    icon: Shield,
    title: "Security",
    content: [
      "Use a strong, unique password for your Sheytoni account.",
      "Enable two-factor authentication when it becomes available.",
      "Review active sessions regularly in Settings → Security.",
      "Report suspicious activity or unauthorized access immediately.",
    ],
  },
];

export function PrivacyContent() {
  return (
    <div className="min-h-dvh pb-6">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Privacy</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <p className="text-sm text-text-muted leading-relaxed">
          Learn how Sheytoni handles your information and what controls you have over your privacy.
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
          Last updated: September 2026
        </p>
      </div>
    </div>
  );
}
