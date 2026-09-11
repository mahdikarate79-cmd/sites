"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Check, CheckCheck, Search, Ban, Trash2, Lock } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { getChatMessages, sendMessage } from "@/lib/api/chat";
import { currentUser } from "@/data/mock/users";
import { mockChats } from "@/data/mock/chats";
import { formatChatTime } from "@/lib/utils/format";
import { ChatInput } from "./ChatInput";
import { PaidMediaModal } from "./PaidMediaModal";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { usePrototype } from "@/lib/hooks/usePrototype";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ChatConversationProps {
  chatId: string;
}

export function ChatConversation({ chatId }: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paidModal, setPaidModal] = useState<ChatMessage | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = mockChats.find((c) => c.id === chatId);
  const { blockUser, deleteChat, isBlocked } = usePrototype();
  const blocked = chat ? isBlocked(chat.participant.id) : false;

  useEffect(() => {
    getChatMessages(chatId).then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string, type: "text" | "image" | "video" | "gif" = "text", extras?: Partial<ChatMessage>) => {
    if (blocked) return;
    const msg = await sendMessage(chatId, {
      chatId,
      senderId: currentUser.id,
      type,
      content,
      ...extras,
    });
    setMessages((prev) => [...prev, msg]);
  };

  const handleDelete = () => {
    deleteChat(chatId);
    setDeleteConfirm(false);
    setMenuOpen(false);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto w-full">
      <div className="sticky top-0 z-30 px-3 pt-3 safe-top">
        <div className="glass-nav rounded-2xl px-2 py-2 flex items-center gap-2">
          <Link href="/chat/" className="p-2 rounded-full hover:bg-surface/60 transition-colors shrink-0" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {chat && (
            <Link
              href={`/profile/${chat.participant.username}/`}
              className="flex-1 flex items-center gap-2.5 min-w-0 px-2 py-1 rounded-xl hover:bg-surface/40 transition-colors"
            >
              <Avatar src={chat.participant.avatar} alt="" size="sm" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{chat.participant.displayName}</p>
                <p className="text-[11px] text-text-muted truncate">{chat.participant.lastSeen ?? "last seen recently"}</p>
              </div>
            </Link>
          )}

          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-surface/60 transition-colors" aria-label="More">
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-xl py-1 shadow-lg z-20">
                <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-surface/80">
                  <Search className="w-4 h-4" /> Search
                </button>
                <button
                  onClick={() => {
                    if (chat) blockUser(chat.participant.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-like hover:bg-surface/80"
                >
                  <Ban className="w-4 h-4" /> Block
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm(true);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-like hover:bg-surface/80"
                >
                  <Trash2 className="w-4 h-4" /> Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {blocked && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-surface/60 border border-border text-xs text-text-muted text-center">
          You blocked this user. They cannot send you messages.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isPaid = msg.paidStars && !isMe && !unlocked.has(msg.id) && !msg.paidUnlocked;

          return (
            <div key={msg.id} className={cn("flex gap-2 group", isMe && "flex-row-reverse")}>
              {!isMe && chat && <Avatar src={chat.participant.avatar} alt="" size="xs" className="mt-1" />}
              <div className={cn("max-w-[75%]", isMe && "items-end")}>
                {msg.type === "text" && (
                  <div className={cn("px-3.5 py-2 rounded-2xl text-sm leading-relaxed", isMe ? "bg-text text-bg rounded-br-md" : "bg-surface rounded-bl-md")}>
                    {msg.spoiler ? <span className="blur-sm hover:blur-none transition-all">{msg.content}</span> : msg.content}
                  </div>
                )}
                {(msg.type === "image" || msg.type === "gif") && (
                  <div
                    className="relative w-48 h-36 rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => (isPaid ? setPaidModal(msg) : undefined)}
                  >
                    {isPaid ? (
                      <div className="w-full h-full bg-surface flex flex-col items-center justify-center gap-1 text-sm">
                        <Lock className="w-4 h-4 text-text-muted" />
                        <span className="flex items-center gap-1">
                          <TelegramStarIcon variant="post" size={16} />
                          {msg.paidStars}
                        </span>
                        <span className="text-[11px] text-text-muted">Tap to unlock</span>
                      </div>
                    ) : (
                      <Image src={msg.content} alt="" fill className={cn("object-cover", msg.spoiler && "blur-lg")} loading="lazy" sizes="192px" />
                    )}
                  </div>
                )}
                {msg.type === "video" &&
                  (isPaid ? (
                    <button
                      onClick={() => setPaidModal(msg)}
                      className="w-48 h-36 rounded-xl bg-surface flex flex-col items-center justify-center gap-1 text-sm"
                    >
                      <Lock className="w-4 h-4 text-text-muted" />
                      <span className="flex items-center gap-1">
                        <TelegramStarIcon variant="post" size={16} />
                        {msg.paidStars}
                      </span>
                      <span className="text-[11px] text-text-muted">Tap to unlock</span>
                    </button>
                  ) : (
                    <video src={msg.content} className="w-48 rounded-xl" controls playsInline preload="none" />
                  ))}
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className={cn("text-[10px]", !isMe && !msg.read ? "text-[#8b5cf6]" : "text-text-muted")}>
                    {formatChatTime(msg.createdAt)}
                  </span>
                  {isMe && (msg.read ? <CheckCheck className="w-3 h-3 text-[#6366f1]" /> : <Check className="w-3 h-3 text-text-muted" />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={blocked} disabledMessage="You cannot message this user" />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-bg rounded-2xl p-5 mx-4 max-w-sm w-full">
            <p className="text-sm mb-4">Are you sure you want to delete this conversation?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-surface text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-like text-white text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {paidModal && (
        <PaidMediaModal
          stars={paidModal.paidStars ?? 0}
          onClose={() => setPaidModal(null)}
          onUnlock={() => {
            setUnlocked((prev) => new Set([...prev, paidModal.id]));
            setPaidModal(null);
          }}
        />
      )}
    </div>
  );
}
