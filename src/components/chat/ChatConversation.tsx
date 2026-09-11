"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { getChatMessages, sendMessage } from "@/lib/api/chat";
import { currentUser } from "@/data/mock/users";
import { mockChats } from "@/data/mock/chats";
import { formatChatTime } from "@/lib/utils/format";
import { ChatInput } from "./ChatInput";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ChatConversationProps {
  chatId: string;
}

export function ChatConversation({ chatId }: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = mockChats.find((c) => c.id === chatId);

  useEffect(() => {
    getChatMessages(chatId).then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string, type: "text" | "image" | "video" = "text") => {
    const msg = await sendMessage(chatId, {
      chatId,
      senderId: currentUser.id,
      type,
      content,
    });
    setMessages((prev) => [...prev, msg]);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={cn("flex gap-2", isMe && "flex-row-reverse")}>
              {!isMe && chat && (
                <Avatar src={chat.participant.avatar} alt="" size="xs" className="mt-1" />
              )}
              <div className={cn("max-w-[75%]", isMe && "items-end")}>
                {msg.type === "text" && (
                  <div
                    className={cn(
                      "px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
                      isMe ? "bg-text text-bg rounded-br-md" : "bg-surface rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                )}
                {msg.type === "image" && (
                  <div className="relative w-48 h-36 rounded-xl overflow-hidden">
                    <Image src={msg.content} alt="Image" fill className="object-cover" loading="lazy" sizes="192px" />
                  </div>
                )}
                {msg.type === "video" && (
                  <video src={msg.content} className="w-48 rounded-xl" controls playsInline preload="none" />
                )}
                <span className="text-[10px] text-text-muted mt-0.5 block px-1">
                  {formatChatTime(msg.createdAt)}
                  {isMe && (msg.read ? " · Read" : " · Sent")}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}
