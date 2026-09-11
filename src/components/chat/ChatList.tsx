"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chat } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatChatTime } from "@/lib/utils/format";
import { getChats } from "@/lib/api/chat";
import { withBasePath } from "@/lib/hooks/useBasePath";

export function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChats().then((data) => {
      setChats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 px-4 py-3 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface rounded w-1/3" />
              <div className="h-3 bg-surface rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={withBasePath(`/chat/${chat.id}`)}
          className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-surface/50 transition-colors"
        >
          <Avatar src={chat.participant.avatar} alt={chat.participant.displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-semibold text-sm truncate">{chat.participant.displayName}</span>
                {chat.participant.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs text-text-muted shrink-0">
                {formatChatTime(chat.lastMessage.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-sm text-text-muted truncate">
                {chat.lastMessage.type === "image" ? "📷 Photo" : chat.lastMessage.type === "video" ? "🎬 Video" : chat.lastMessage.content}
              </p>
              {chat.unreadCount > 0 && (
                <span className="shrink-0 w-5 h-5 rounded-full bg-text text-bg text-xs flex items-center justify-center font-medium">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
