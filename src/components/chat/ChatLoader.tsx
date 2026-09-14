"use client";

import { useEffect, useState } from "react";
import { ChatConversation } from "./ChatConversation";

interface ChatLoaderProps {
  chatId: string;
}

function resolveChatIdFromPath(propChatId: string): string {
  if (typeof window === "undefined") return decodeURIComponent(propChatId);
  const parts = window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  const idx = parts.indexOf("chat");
  if (idx >= 0 && parts[idx + 1]) {
    const slug = decodeURIComponent(parts[idx + 1]);
    if (slug !== "placeholder") return slug;
  }
  return decodeURIComponent(propChatId);
}

export function ChatLoader({ chatId }: ChatLoaderProps) {
  const [resolvedId, setResolvedId] = useState(() => resolveChatIdFromPath(chatId));

  useEffect(() => {
    setResolvedId(resolveChatIdFromPath(chatId));
  }, [chatId]);

  return <ChatConversation chatId={resolvedId} />;
}
