"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Check, CheckCheck, Search, Trash2, CornerUpRight } from "lucide-react";
import { ChatMessage, PinnedMessageInfo } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { BlockButton } from "@/components/ui/BlockButton";
import { UserName } from "@/components/ui/UserName";
import { getChatMessages, sendMessage, sendAlbumMessage, forwardMessage } from "@/lib/api/chat";
import { SelectedMedia } from "./MediaGalleryPicker";
import { currentUser } from "@/data/mock/users";
import { mockChats } from "@/data/mock/chats";
import { formatChatTime } from "@/lib/utils/format";
import { ChatInput } from "./ChatInput";
import { PaidMediaModal } from "./PaidMediaModal";
import { PinnedMessageBar } from "./PinnedMessageBar";
import { MessageContextMenu } from "./MessageContextMenu";
import { LockedMediaOverlay } from "./LockedMediaOverlay";
import { ShareChatPicker } from "./ShareChatPicker";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ChatConversationProps {
  chatId: string;
}

const INITIAL_PINNED: Record<string, PinnedMessageInfo> = {
  c1: { messageId: "c1m2", scope: "both" },
  c2: { messageId: "c2m1", scope: "me" },
};

const TEMP_SECONDS: Record<string, number> = { "3s": 3, "10s": 10, "30s": 30 };

function mediaTransform(rotation?: number, mirrored?: boolean) {
  const parts: string[] = [];
  if (rotation) parts.push(`rotate(${rotation}deg)`);
  if (mirrored) parts.push("scaleX(-1)");
  return parts.length ? parts.join(" ") : undefined;
}

export function ChatConversation({ chatId }: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paidModal, setPaidModal] = useState<ChatMessage | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [openedTemp, setOpenedTemp] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<PinnedMessageInfo | null>(INITIAL_PINNED[chatId] ?? null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [contextMsg, setContextMsg] = useState<ChatMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const tempTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const chat = mockChats.find((c) => c.id === chatId);
  const { deleteChat, isBlocked } = usePrototype();
  const { showToast } = useToast();
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

  useEffect(() => {
    return () => {
      Object.values(tempTimers.current).forEach(clearTimeout);
    };
  }, []);

  const pinnedMessage = pinned ? messages.find((m) => m.id === pinned.messageId) : null;

  const removeMessage = useCallback((msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (pinned?.messageId === msgId) setPinned(null);
  }, [pinned]);

  const scheduleTempDelete = useCallback((msgId: string, seconds: number) => {
    if (tempTimers.current[msgId]) clearTimeout(tempTimers.current[msgId]);
    tempTimers.current[msgId] = setTimeout(() => {
      removeMessage(msgId);
      delete tempTimers.current[msgId];
    }, seconds * 1000);
  }, [removeMessage]);

  const openTemporaryMedia = useCallback((msg: ChatMessage) => {
    setOpenedTemp((prev) => new Set([...prev, msg.id]));
    if (msg.temporary === "view_once") {
      scheduleTempDelete(msg.id, 1);
    } else if (msg.temporary && TEMP_SECONDS[msg.temporary]) {
      scheduleTempDelete(msg.id, TEMP_SECONDS[msg.temporary]);
    }
  }, [scheduleTempDelete]);

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  const handleSend = async (
    content: string,
    type: "text" | "image" | "video" | "gif" = "text",
    extras?: Partial<ChatMessage>
  ) => {
    if (blocked || sendingRef.current) return;
    sendingRef.current = true;
    try {
      const msg = await sendMessage(chatId, {
        chatId,
        senderId: currentUser.id,
        type,
        content,
        ...extras,
      });
      appendMessage(msg);
      setReplyTo(null);
    } finally {
      sendingRef.current = false;
    }
  };

  const handleSendAlbum = async (items: SelectedMedia[], caption: string) => {
    if (blocked || sendingRef.current || items.length === 0) return;
    sendingRef.current = true;
    try {
      const first = items[0];
      const msg = await sendAlbumMessage(chatId, {
        senderId: currentUser.id,
        album: items.map((m) => ({
          type: m.item.type,
          url: m.item.url,
          rotation: m.rotation,
        })),
        caption: caption || undefined,
        spoiler: items.some((m) => m.spoiler),
        paidStars: first?.paidStars,
        replyTo: replyTo?.id,
        temporary: first?.temporary,
        rotation: first?.rotation,
        mirrored: first?.mirrored,
      });
      appendMessage(msg);
      setReplyTo(null);
    } finally {
      sendingRef.current = false;
    }
  };

  const handleForward = async (targetChatIds: string[]) => {
    if (!forwardMsg || targetChatIds.length === 0) return;
    const sourceUser = forwardMsg.senderId === currentUser.id
      ? currentUser
      : chat?.participant;
    const forwardedFrom = {
      userId: sourceUser?.id ?? forwardMsg.senderId,
      displayName: sourceUser?.displayName ?? "User",
      username: sourceUser?.username ?? "user",
      preview: forwardMsg.type === "text" ? forwardMsg.content : forwardMsg.caption ?? forwardMsg.type,
    };
    for (const targetId of targetChatIds) {
      const msg = await forwardMessage(targetId, {
        senderId: currentUser.id,
        source: forwardMsg,
        forwardedFrom,
      });
      if (targetId === chatId) appendMessage(msg);
    }
    showToast("Forwarded");
    setForwardMsg(null);
  };

  const handleDelete = () => {
    deleteChat(chatId);
    setDeleteConfirm(false);
    setMenuOpen(false);
  };

  const handleDeleteMessage = (msgId: string) => {
    removeMessage(msgId);
  };

  const handlePin = (msg: ChatMessage, scope: "me" | "both") => {
    setPinned({ messageId: msg.id, scope });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, pinned: true, pinnedScope: scope } : { ...m, pinned: false, pinnedScope: undefined }
      )
    );
    showToast(scope === "both" ? "Pinned for both" : "Pinned for you");
  };

  const scrollToMessage = (msgId: string) => {
    messageRefs.current[msgId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const startLongPress = (msg: ChatMessage) => {
    longPressTimer.current = setTimeout(() => setContextMsg(msg), 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const isPaidLocked = (msg: ChatMessage, isMe: boolean) =>
    !!msg.paidStars && !isMe && !unlocked.has(msg.id) && !msg.paidUnlocked;

  const isTempLocked = (msg: ChatMessage, isMe: boolean) =>
    !!msg.temporary && !isMe && !openedTemp.has(msg.id);

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>;

  const renderForwarded = (msg: ChatMessage) => {
    if (!msg.forwardedFrom) return null;
    return (
      <div className="mb-1 px-1 text-[10px] text-[#8b5cf6] border-l-2 border-[#8b5cf6] pl-1.5">
        <span className="flex items-center gap-0.5 font-medium">
          <CornerUpRight className="w-3 h-3" />
          Forwarded message
        </span>
        <span className="text-text-muted block truncate">{msg.forwardedFrom.displayName}</span>
      </div>
    );
  };

  const renderMedia = (msg: ChatMessage, isMe: boolean) => {
    const paid = isPaidLocked(msg, isMe);
    const tempLocked = isTempLocked(msg, isMe);
    const locked = paid || tempLocked;
    const transform = mediaTransform(msg.rotation, msg.mirrored);

    const handleMediaClick = () => {
      if (paid) setPaidModal(msg);
      else if (tempLocked) openTemporaryMedia(msg);
    };

    if (msg.type === "image" || msg.type === "gif") {
      return (
        <div
          className={cn("relative w-48 h-36 rounded-xl overflow-hidden", locked && "cursor-pointer")}
          onClick={handleMediaClick}
        >
          {!locked && (
            <Image
              src={msg.content}
              alt=""
              fill
              className={cn("object-cover", msg.spoiler && "blur-lg")}
              style={{ transform }}
              loading="lazy"
              sizes="192px"
            />
          )}
          {locked && (
            <>
              <Image src={msg.content} alt="" fill className="object-cover blur-xl scale-110" sizes="192px" />
              {paid ? (
                <LockedMediaOverlay stars={msg.paidStars} onClick={handleMediaClick} />
              ) : (
                <LockedMediaOverlay label="Tap to view" onClick={handleMediaClick} />
              )}
            </>
          )}
        </div>
      );
    }

    if (msg.type === "album" && msg.album) {
      return (
        <div
          className={cn(
            "grid gap-0.5 rounded-xl overflow-hidden",
            msg.album.length === 1 ? "grid-cols-1" : "grid-cols-2",
            locked && "cursor-pointer"
          )}
          onClick={handleMediaClick}
        >
          {locked ? (
            <div className="relative col-span-2 w-48 h-36 rounded-xl overflow-hidden">
              <Image src={msg.album[0].url} alt="" fill className="object-cover blur-xl scale-110" unoptimized />
              {paid ? (
                <LockedMediaOverlay stars={msg.paidStars} onClick={handleMediaClick} />
              ) : (
                <LockedMediaOverlay label="Tap to view" onClick={handleMediaClick} />
              )}
            </div>
          ) : (
            msg.album.map((item, i) => (
              <div key={i} className="relative w-24 h-24 bg-surface">
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <Image src={item.url} alt="" fill className={cn("object-cover", msg.spoiler && "blur-lg")} unoptimized />
                )}
              </div>
            ))
          )}
        </div>
      );
    }

    if (msg.type === "video") {
      if (locked) {
        return (
          <div className="relative w-48 h-36 rounded-xl overflow-hidden cursor-pointer" onClick={handleMediaClick}>
            <div className="w-full h-full bg-surface" />
            {paid ? (
              <LockedMediaOverlay stars={msg.paidStars} onClick={handleMediaClick} />
            ) : (
              <LockedMediaOverlay label="Tap to view" onClick={handleMediaClick} />
            )}
          </div>
        );
      }
      return (
        <video
          src={msg.content}
          className="w-48 rounded-xl"
          style={{ transform }}
          controls
          playsInline
          preload="none"
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto w-full overflow-hidden">
      <header className="shrink-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
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
                <UserName user={chat.participant} nameClassName="font-semibold text-sm" />
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
                {chat && <BlockButton userId={chat.participant.id} variant="menu" onAction={() => setMenuOpen(false)} />}
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
      </header>

      {pinnedMessage && pinned && (
        <div className="shrink-0">
          <PinnedMessageBar
            message={pinnedMessage}
            scope={pinned.scope}
            onClick={() => scrollToMessage(pinned.messageId)}
            onUnpin={() => {
              setPinned(null);
              setMessages((prev) => prev.map((m) => ({ ...m, pinned: false, pinnedScope: undefined })));
            }}
          />
        </div>
      )}

      {blocked && (
        <div className="shrink-0 mx-4 mt-2 px-3 py-2 rounded-xl bg-surface/60 border border-border text-xs text-text-muted text-center">
          You blocked this user. They cannot send you messages.
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const replySource = msg.replyTo ? messages.find((m) => m.id === msg.replyTo) : null;

          return (
            <div
              key={msg.id}
              ref={(el) => { messageRefs.current[msg.id] = el; }}
              className={cn("flex gap-2 group", isMe && "flex-row-reverse")}
              onTouchStart={() => startLongPress(msg)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMsg(msg);
              }}
            >
              {!isMe && chat && <Avatar src={chat.participant.avatar} alt="" size="xs" className="mt-1" />}
              <div className={cn("max-w-[75%]", isMe && "items-end")}>
                {renderForwarded(msg)}
                {replySource && (
                  <div className="text-[10px] text-text-muted mb-0.5 px-1 border-l-2 border-[#8b5cf6] pl-1.5 truncate">
                    {replySource.type === "text" ? replySource.content : replySource.type}
                  </div>
                )}
                {msg.type === "text" && (
                  <div
                    className={cn(
                      "px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
                      isMe ? "bg-text text-bg rounded-br-md" : "bg-surface rounded-bl-md"
                    )}
                    style={msg.rotation ? { transform: `rotate(${msg.rotation}deg)` } : undefined}
                  >
                    {msg.spoiler ? (
                      <span className="blur-sm hover:blur-none transition-all">{msg.content}</span>
                    ) : (
                      msg.content
                    )}
                  </div>
                )}
                {msg.type !== "text" && renderMedia(msg, isMe)}
                {msg.caption && <p className="text-xs text-text-muted mt-1 px-1">{msg.caption}</p>}
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

      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          onSendAlbum={handleSendAlbum}
          disabled={blocked}
          disabledMessage="You cannot message this user"
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      <MessageContextMenu
        open={!!contextMsg}
        message={contextMsg}
        isMedia={contextMsg ? contextMsg.type !== "text" : false}
        isViewOnce={contextMsg?.temporary === "view_once"}
        onClose={() => setContextMsg(null)}
        onReply={() => contextMsg && setReplyTo(contextMsg)}
        onForward={() => contextMsg && setForwardMsg(contextMsg)}
        onCopy={async () => {
          if (contextMsg) {
            await navigator.clipboard.writeText(contextMsg.content);
            showToast("Copied");
          }
        }}
        onPin={(scope) => contextMsg && handlePin(contextMsg, scope)}
        onDelete={() => contextMsg && handleDeleteMessage(contextMsg.id)}
        onSave={() => showToast("Saved to gallery")}
      />

      <ShareChatPicker
        open={!!forwardMsg}
        onClose={() => setForwardMsg(null)}
        title="Forward to"
        onSend={handleForward}
      />

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
