"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Check, CheckCheck, Search, Trash2, CornerUpRight, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { ChatMessage, PinnedMessageInfo } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { BlockButton } from "@/components/ui/BlockButton";
import { UserName } from "@/components/ui/UserName";
import { getChat, getChatMessages, sendMessage, sendAlbumMessage, forwardMessage, expireChatMessage } from "@/lib/api/chat";
import { uploadMedia } from "@/lib/api/storage";
import { SelectedMedia } from "./MediaGalleryPicker";
import { Chat } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { createPaidMediaInvoice, openTelegramInvoice } from "@/lib/api/payments";
import { fetchPaidMediaUnlocks } from "@/lib/api/social";
import { formatChatTime } from "@/lib/utils/format";
import { ChatInput } from "./ChatInput";
import { PinnedMessageBar } from "./PinnedMessageBar";
import { MessageContextMenu } from "./MessageContextMenu";
import { SpoilerOverlay, PaidPriceBadge } from "./SpoilerOverlay";
import { ShareChatPicker } from "./ShareChatPicker";
import { ChatMediaViewer } from "./ChatMediaViewer";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { lockScroll, unlockScroll } from "@/lib/utils/scrollLock";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ChatConversationProps {
  chatId: string;
}

function mediaTransform(rotation?: number, mirrored?: boolean) {
  const parts: string[] = [];
  if (rotation) parts.push(`rotate(${rotation}deg)`);
  if (mirrored) parts.push("scaleX(-1)");
  return parts.length ? parts.join(" ") : undefined;
}

function makeOptimisticId() {
  return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function uploadSelectedMedia(item: SelectedMedia, isPremium = false) {
  if (item.item.objectKey) {
    return {
      type: item.item.type,
      url: item.croppedUrl ?? item.item.url,
      objectKey: item.item.objectKey,
    };
  }
  const displayUrl = item.croppedUrl ?? item.item.url;
  if (displayUrl.startsWith("blob:") || displayUrl.startsWith("data:")) {
    const res = await fetch(displayUrl);
    const blob = await res.blob();
    const ext = item.item.type === "video" ? ".mp4" : ".jpg";
    const mime = blob.type || (item.item.type === "video" ? "video/mp4" : "image/jpeg");
    const f = new File([blob], `chat${ext}`, { type: mime });
    const uploaded = await uploadMedia(f, "chat", { isPremium });
    return { type: item.item.type, url: uploaded.media.url, objectKey: uploaded.objectKey };
  }
  const file = item.item.sourceFile;
  if (file) {
    const uploaded = await uploadMedia(file, "chat", { isPremium });
    return { type: item.item.type, url: uploaded.media.url, objectKey: uploaded.objectKey };
  }
  throw new Error("Upload media via gallery");
}

function getViewerMedia(msg: ChatMessage) {
  if (msg.type === "image" || msg.type === "gif") {
    return { url: msg.content, type: msg.type as "image" | "gif", rotation: msg.rotation, mirrored: msg.mirrored };
  }
  if (msg.type === "video") {
    return { url: msg.content, type: "video" as const, rotation: msg.rotation, mirrored: msg.mirrored };
  }
  if (msg.type === "album" && msg.album?.[0]) {
    const item = msg.album[0];
    return { url: item.url, type: item.type, rotation: item.rotation };
  }
  return null;
}

export function ChatConversation({ chatId }: ChatConversationProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [viewerMsg, setViewerMsg] = useState<ChatMessage | null>(null);
  const [viewerAlbumIndex, setViewerAlbumIndex] = useState(0);
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const [, setTimerTick] = useState(0);
  const [pinned, setPinned] = useState<PinnedMessageInfo | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [contextMsg, setContextMsg] = useState<ChatMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    deleteChat, isBlocked, isPaidMediaUnlocked, unlockPaidMediaMessage,
    isTempMediaExpired, isTempMediaViewed, markTempMediaViewed, expireTempMedia,
    startTempMediaTimer, getTempMediaRemaining, getCurrentUser,
  } = usePrototype();
  const currentUser = getCurrentUser();
  const { showToast } = useToast();
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const [serverViewerId, setServerViewerId] = useState<string | null>(null);
  const viewerId = serverViewerId ?? authUser?.id ?? null;
  const [paying, setPaying] = useState(false);
  const blocked = chat ? isBlocked(chat.participant.id) : false;

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  const syncMessages = useCallback(() => {
    getChatMessages(chatId).then((data) => {
      if (data.viewerId) setServerViewerId(data.viewerId);
      setMessages(data.messages.filter((m) => !m.expired && !isTempMediaExpired(chatId, m.id)));
    }).catch(() => {});
  }, [chatId, isTempMediaExpired]);

  useEffect(() => {
    setLoading(true);
    setServerViewerId(null);
    getChat(chatId).then((data) => {
      if (data) {
        setChat(data.chat);
        if (data.viewerId) setServerViewerId(data.viewerId);
      }
    });
    getChatMessages(chatId).then((data) => {
      if (data.viewerId) setServerViewerId(data.viewerId);
      setMessages(data.messages.filter((m) => !m.expired && !isTempMediaExpired(chatId, m.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chatId, isTempMediaExpired]);

  useEffect(() => {
    if (authUser?.id) setServerViewerId((prev) => prev ?? authUser.id);
  }, [authUser?.id]);

  useEffect(() => {
    const interval = setInterval(syncMessages, 8000);
    return () => clearInterval(interval);
  }, [syncMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((t) => t + 1);
      messages.forEach((msg) => {
        if (!msg.temporary || msg.temporary === "view_once") return;
        if (!isTempMediaViewed(chatId, msg.id)) return;
        const remaining = getTempMediaRemaining(chatId, msg.id, msg.temporary);
        if (remaining !== null && remaining <= 0) {
          expireChatMessage(chatId, msg.id).catch(() => {});
          expireTempMedia(chatId, msg.id);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          if (viewerMsg?.id === msg.id) setViewerMsg(null);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [messages, viewerMsg, chatId, isTempMediaViewed, getTempMediaRemaining, expireTempMedia]);

  const pinnedMessage = pinned ? messages.find((m) => m.id === pinned.messageId) : null;

  const removeMessage = useCallback((msgId: string) => {
    expireTempMedia(chatId, msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (pinned?.messageId === msgId) setPinned(null);
  }, [chatId, expireTempMedia, pinned]);

  const upsertMessage = useCallback((clientId: string, next: ChatMessage) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === next.id || m.clientId === clientId);
      if (exists) {
        return prev.map((m) => (m.clientId === clientId || m.id === clientId ? next : m));
      }
      return [...prev, next];
    });
  }, []);

  const addOptimistic = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.clientId === msg.clientId) ? prev : [...prev, msg]));
  }, []);

  const handleSend = async (
    content: string,
    type: "text" | "image" | "video" | "gif" = "text",
    extras?: Partial<ChatMessage>
  ) => {
    if (blocked || !viewerId || !isAuthenticated || authLoading) return;
    const clientId = makeOptimisticId();
    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      chatId,
      senderId: viewerId,
      type,
      content,
      createdAt: new Date().toISOString(),
      read: false,
      sendStatus: "sending",
      ...extras,
    };
    addOptimistic(optimistic);
    setReplyTo(null);

    try {
      await new Promise((r) => setTimeout(r, 200));
      const msg = await sendMessage(chatId, {
        chatId,
        senderId: viewerId,
        type,
        content,
        ...extras,
      });
      upsertMessage(clientId, { ...msg, sendStatus: "sent", clientId });
    } catch (e) {
      upsertMessage(clientId, { ...optimistic, sendStatus: "failed" });
      showToast(e instanceof Error ? e.message : "Failed to send");
    }
  };

  const retrySend = async (msg: ChatMessage) => {
    if (!msg.clientId || !viewerId) return;
    upsertMessage(msg.clientId, { ...msg, sendStatus: "sending" });
    try {
      const sent = await sendMessage(chatId, {
        chatId,
        senderId: viewerId,
        type: msg.type,
        content: msg.content,
        replyTo: msg.replyTo,
      });
      upsertMessage(msg.clientId, { ...sent, sendStatus: "sent", clientId: msg.clientId });
    } catch {
      upsertMessage(msg.clientId, { ...msg, sendStatus: "failed" });
    }
  };

  const handleSendAlbum = async (items: SelectedMedia[], caption: string) => {
    if (blocked || items.length === 0 || !viewerId || !isAuthenticated || authLoading) return;
    const replyId = replyTo?.id;
    const clientId = makeOptimisticId();
    const first = items[0];
    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      chatId,
      senderId: viewerId,
      type: "album",
      content: caption,
      album: items.map((m) => ({ type: m.item.type, url: m.croppedUrl ?? m.item.url, rotation: m.rotation })),
      caption,
      paidStars: first?.paidStars,
      temporary: first?.temporary,
      rotation: first?.rotation,
      mirrored: first?.mirrored,
      createdAt: new Date().toISOString(),
      read: false,
      sendStatus: "sending",
      replyTo: replyId,
    };
    addOptimistic(optimistic);
    setReplyTo(null);

    try {
      const uploaded = await Promise.all(items.map((item) => uploadSelectedMedia(item, !!authUser?.premium)));
      if (uploaded.length === 1 && uploaded[0].type !== "gif") {
        const single = uploaded[0];
        const msg = await sendMessage(chatId, {
          chatId,
          senderId: viewerId,
          type: single.type,
          content: single.url,
          objectKey: single.objectKey,
          caption: caption || undefined,
          spoiler: items.some((m) => m.spoiler),
          paidStars: first?.paidStars,
          replyTo: replyId,
          temporary: first?.temporary,
          rotation: first?.rotation,
          mirrored: first?.mirrored,
        });
        upsertMessage(clientId, { ...msg, sendStatus: "sent", clientId });
        return;
      }
      const msg = await sendAlbumMessage(chatId, {
        senderId: viewerId,
        album: uploaded.map((m, i) => ({
          type: m.type,
          url: m.url,
          objectKey: m.objectKey,
          rotation: items[i]?.rotation,
        })),
        caption: caption || undefined,
        spoiler: items.some((m) => m.spoiler),
        paidStars: first?.paidStars,
        replyTo: replyId,
        temporary: first?.temporary,
        rotation: first?.rotation,
        mirrored: first?.mirrored,
      });
      upsertMessage(clientId, { ...msg, sendStatus: "sent", clientId });
    } catch (e) {
      upsertMessage(clientId, { ...optimistic, sendStatus: "failed" });
      showToast(e instanceof Error ? e.message : "Failed to send media");
    }
  };

  const handleForward = async (targetChatIds: string[]) => {
    if (!forwardMsg || targetChatIds.length === 0 || !viewerId) return;
    const sourceUser = forwardMsg.senderId === viewerId ? currentUser : chat?.participant;
    const forwardedFrom = {
      userId: sourceUser?.id ?? forwardMsg.senderId,
      displayName: sourceUser?.displayName ?? "User",
      username: sourceUser?.username ?? "user",
      preview: forwardMsg.type === "text" ? forwardMsg.content : forwardMsg.caption ?? forwardMsg.type,
    };
    for (const targetId of targetChatIds) {
      const msg = await forwardMessage(targetId, {
        senderId: viewerId,
        source: forwardMsg,
        forwardedFrom,
      });
      if (targetId === chatId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    }
    showToast("Forwarded");
    setForwardMsg(null);
  };

  const handleDelete = () => {
    deleteChat(chatId);
    setDeleteConfirm(false);
    setMenuOpen(false);
  };

  const handleDeleteMessage = (msgId: string) => removeMessage(msgId);

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
    !!msg.paidStars && !isMe && !isPaidMediaUnlocked(chatId, msg.id) && !msg.paidUnlocked;

  const isTempLocked = (msg: ChatMessage, isMe: boolean) =>
    !!msg.temporary && !isMe && !isTempMediaViewed(chatId, msg.id) && !isTempMediaExpired(chatId, msg.id);

  const getViewerAlbum = (msg: ChatMessage) => {
    if (msg.type === "album" && msg.album) {
      return msg.album.map((item) => ({
        url: item.url,
        type: item.type,
        rotation: item.rotation,
        mirrored: msg.mirrored,
      }));
    }
    const single = getViewerMedia(msg);
    return single ? [single] : [];
  };

  const openMediaViewer = (msg: ChatMessage, albumIndex = 0) => {
    const album = getViewerAlbum(msg);
    if (album.length === 0) return;

    const isMe = msg.senderId === viewerId;
    if (isTempLocked(msg, isMe)) {
      markTempMediaViewed(chatId, msg.id);
      if (msg.temporary && msg.temporary !== "view_once") {
        startTempMediaTimer(chatId, msg.id);
      }
    }

    setViewerAlbumIndex(albumIndex);
    setViewerMsg(msg);
  };

  const closeMediaViewer = () => {
    if (viewerMsg?.temporary === "view_once" && viewerMsg.senderId !== viewerId) {
      expireChatMessage(chatId, viewerMsg.id).catch(() => {});
      expireTempMedia(chatId, viewerMsg.id);
      removeMessage(viewerMsg.id);
    }
    setViewerMsg(null);
    setViewerAlbumIndex(0);
    setShowUnlockAnim(false);
  };

  const handlePayInViewer = async () => {
    if (!viewerMsg?.paidStars || paying || !chat) return;
    if (!isAuthenticated) return;
    setPaying(true);
    try {
      const invoice = await createPaidMediaInvoice(
        chatId,
        viewerMsg.id,
        chat.participant.id,
        viewerMsg.paidStars,
      );
      if (!invoice.invoiceUrl) {
        showToast("Payment unavailable");
        setPaying(false);
        return;
      }
      const opened = openTelegramInvoice(invoice.invoiceUrl, async (status) => {
        if (status === "paid") {
          unlockPaidMediaMessage(chatId, viewerMsg.id);
          await fetchPaidMediaUnlocks();
          setShowUnlockAnim(true);
          showToast("Media unlocked");
        } else if (status === "failed") {
          showToast("Payment failed");
        }
        setPaying(false);
      });
      if (!opened) {
        showToast("Open in Telegram to pay with Stars");
        setPaying(false);
      }
    } catch {
      showToast("Payment failed");
      setPaying(false);
    }
  };

  const renderStatusIcon = (msg: ChatMessage, isMe: boolean) => {
    if (!isMe) return null;
    if (msg.sendStatus === "sending") return <Loader2 className="w-3 h-3 text-text-muted animate-spin" />;
    if (msg.sendStatus === "failed") {
      return (
        <button type="button" onClick={() => retrySend(msg)} aria-label="Retry send">
          <AlertCircle className="w-3 h-3 text-like" />
        </button>
      );
    }
    return msg.read ? <CheckCheck className="w-3 h-3 text-[#6366f1]" /> : <Check className="w-3 h-3 text-text-muted" />;
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted h-dvh">Loading...</div>;
  if (!chat) return <div className="flex-1 flex items-center justify-center text-text-muted h-dvh">Chat not found</div>;

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
    const isMediaType = msg.type === "image" || msg.type === "gif" || msg.type === "video" || msg.type === "album";

    const handleMediaClick = (albumIndex = 0) => {
      if (!isMediaType) return;
      openMediaViewer(msg, albumIndex);
    };

    const showPaidBadge = !!msg.paidStars && isMe;

    if (msg.type === "image" || msg.type === "gif") {
      return (
        <div className={cn("relative w-48 h-36 rounded-xl overflow-hidden cursor-pointer", locked && "cursor-pointer")} onClick={() => handleMediaClick(0)}>
          <Image
            src={msg.content}
            alt=""
            fill
            className={cn("object-cover", locked && "blur-xl scale-110")}
            style={!locked ? { transform } : undefined}
            loading="lazy"
            sizes="192px"
            unoptimized
          />
          {locked && (
            paid
              ? <SpoilerOverlay stars={msg.paidStars} onClick={() => handleMediaClick(0)} />
              : <SpoilerOverlay variant="temp" onClick={() => handleMediaClick(0)} />
          )}
          {showPaidBadge && <PaidPriceBadge stars={msg.paidStars!} />}
        </div>
      );
    }

    if (msg.type === "album" && msg.album) {
      return (
        <div className={cn("relative rounded-xl overflow-hidden", locked ? "w-48 h-36 cursor-pointer" : "grid gap-0.5", !locked && (msg.album.length === 1 ? "grid-cols-1" : "grid-cols-2"))}>
          {locked ? (
            <div className="relative w-full h-full" onClick={() => handleMediaClick(0)}>
              <Image src={msg.album[0].url} alt="" fill className="object-cover blur-xl scale-110" unoptimized />
              {paid
                ? <SpoilerOverlay stars={msg.paidStars} onClick={() => handleMediaClick(0)} />
                : <SpoilerOverlay variant="temp" onClick={() => handleMediaClick(0)} />}
            </div>
          ) : (
            msg.album.map((item, i) => (
              <div key={i} className="relative w-24 h-24 bg-surface cursor-pointer" onClick={() => handleMediaClick(i)}>
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                )}
              </div>
            ))
          )}
          {showPaidBadge && <PaidPriceBadge stars={msg.paidStars!} />}
        </div>
      );
    }

    if (msg.type === "video") {
      return (
        <div className={cn("relative w-48 h-36 rounded-xl overflow-hidden cursor-pointer")} onClick={() => handleMediaClick(0)}>
          {locked ? (
            <>
              <div className="w-full h-full bg-surface" />
              {paid
                ? <SpoilerOverlay stars={msg.paidStars} onClick={() => handleMediaClick(0)} />
                : <SpoilerOverlay variant="temp" onClick={() => handleMediaClick(0)} />}
            </>
          ) : (
            <video src={msg.content} className="w-full h-full object-cover rounded-xl" style={{ transform }} muted playsInline preload="metadata" />
          )}
          {showPaidBadge && <PaidPriceBadge stars={msg.paidStars!} />}
        </div>
      );
    }

    return null;
  };

  const viewerAlbum = viewerMsg ? getViewerAlbum(viewerMsg) : [];
  const viewerMedia = viewerAlbum[viewerAlbumIndex] ?? (viewerMsg ? getViewerMedia(viewerMsg) : null);
  const viewerIsMe = viewerMsg ? viewerMsg.senderId === viewerId : false;
  const viewerPaidLocked = viewerMsg ? isPaidLocked(viewerMsg, viewerIsMe) && !showUnlockAnim : false;
  const viewerTempRestricted = viewerMsg ? !!viewerMsg.temporary && !viewerIsMe : false;
  const viewerTimerRemaining = viewerMsg?.temporary && viewerMsg.temporary !== "view_once"
    ? getTempMediaRemaining(chatId, viewerMsg.id, viewerMsg.temporary)
    : null;

  return (
    <div className="flex flex-col h-dvh w-full max-w-2xl mx-auto overflow-hidden bg-bg">
      <header className="shrink-0 z-30 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1">
        <div className="glass-nav rounded-2xl px-2 py-1.5 flex items-center gap-2">
          <Link href="/chat/" className="p-2 rounded-full hover:bg-surface/60 transition-colors shrink-0" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {chat && (
            chat.participant.deleted ? (
              <div className="flex-1 flex items-center gap-2.5 min-w-0 px-2 py-1">
                <Avatar src="" alt="" size="sm" />
                <div className="min-w-0 text-left">
                  <p className="font-semibold text-sm text-text-muted">Deleted Account</p>
                </div>
              </div>
            ) : (
              <ProfileLink user={chat.participant} className="flex-1 flex items-center gap-2.5 min-w-0 px-2 py-1 rounded-xl hover:bg-surface/40 transition-colors">
                <Avatar src={chat.participant.avatar} alt="" size="sm" />
                <div className="min-w-0 text-left">
                  <UserName user={chat.participant} nameClassName="font-semibold text-sm" />
                  <p className="text-[11px] text-text-muted truncate">{chat.participant.lastSeen ?? "last seen recently"}</p>
                </div>
              </ProfileLink>
            )
          )}
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-surface/60 transition-colors" aria-label="More">
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-xl py-1 shadow-lg z-20">
                <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-surface/80"><Search className="w-4 h-4" /> Search</button>
                {chat && <BlockButton userId={chat.participant.id} variant="menu" onAction={() => setMenuOpen(false)} />}
                <button onClick={() => { setDeleteConfirm(true); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-like hover:bg-surface/80">
                  <Trash2 className="w-4 h-4" /> Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {pinnedMessage && pinned && (
        <div className="shrink-0 z-20">
          <PinnedMessageBar message={pinnedMessage} scope={pinned.scope} onClick={() => scrollToMessage(pinned.messageId)} onUnpin={() => {
            setPinned(null);
            setMessages((prev) => prev.map((m) => ({ ...m, pinned: false, pinnedScope: undefined })));
          }} />
        </div>
      )}

      {blocked && (
        <div className="shrink-0 mx-3 px-3 py-2 rounded-xl glass-nav text-xs text-text-muted text-center">
          You blocked this user. They cannot send you messages.
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 space-y-3">
        {!viewerId && !loading && (
          <div className="text-center text-xs text-text-muted py-4">Sign in to view messages</div>
        )}
        {viewerId && messages.filter((m) => !m.expired && !isTempMediaExpired(chatId, m.id)).map((msg) => {
          const isMe = msg.senderId === viewerId;
          const replySource = msg.replyTo ? messages.find((m) => m.id === msg.replyTo) : null;

          return (
            <div
              key={msg.clientId ?? msg.id}
              ref={(el) => { messageRefs.current[msg.id] = el; }}
              className={cn("flex gap-2 group", isMe && "flex-row-reverse")}
              onTouchStart={() => startLongPress(msg)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onContextMenu={(e) => { e.preventDefault(); setContextMsg(msg); }}
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
                  <div className={cn("px-3.5 py-2 rounded-2xl text-sm leading-relaxed", isMe ? "bg-text text-bg rounded-br-md" : "bg-surface rounded-bl-md")}>
                    {msg.spoiler ? <span className="blur-sm hover:blur-none transition-all">{msg.content}</span> : msg.content}
                  </div>
                )}
                {msg.type !== "text" && renderMedia(msg, isMe)}
                {msg.caption && <p className="text-xs text-text-muted mt-1 px-1">{msg.caption}</p>}
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className={cn("text-[10px]", !isMe && !msg.read ? "text-[#8b5cf6]" : "text-text-muted")}>
                    {formatChatTime(msg.createdAt)}
                  </span>
                  {renderStatusIcon(msg, isMe)}
                  {msg.sendStatus === "failed" && isMe && (
                    <button type="button" onClick={() => retrySend(msg)} className="text-[10px] text-like flex items-center gap-0.5">
                      <RotateCcw className="w-2.5 h-2.5" /> Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="glass-nav rounded-2xl overflow-hidden">
          <ChatInput
            onSend={handleSend}
            onSendAlbum={handleSendAlbum}
            disabled={blocked}
            disabledMessage="You cannot message this user"
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            embedded
          />
        </div>
      </div>

      <MessageContextMenu
        open={!!contextMsg}
        message={contextMsg}
        isMedia={contextMsg ? contextMsg.type !== "text" : false}
        isViewOnce={contextMsg?.temporary === "view_once"}
        isTempMedia={!!contextMsg?.temporary}
        isPaidMedia={!!contextMsg?.paidStars}
        onClose={() => setContextMsg(null)}
        onReply={() => contextMsg && setReplyTo(contextMsg)}
        onForward={() => contextMsg && setForwardMsg(contextMsg)}
        onCopy={async () => { if (contextMsg) { await navigator.clipboard.writeText(contextMsg.content); showToast("Copied"); } }}
        onPin={(scope) => contextMsg && handlePin(contextMsg, scope)}
        onDelete={() => contextMsg && handleDeleteMessage(contextMsg.id)}
        onSave={() => showToast("Saved to gallery")}
      />

      <ShareChatPicker open={!!forwardMsg} onClose={() => setForwardMsg(null)} title="Forward to" onSend={handleForward} />

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

      {viewerMsg && viewerMedia && chat && (
        <ChatMediaViewer
          open
          message={viewerMsg}
          media={viewerMedia}
          sender={viewerIsMe ? currentUser : chat.participant}
          isMe={viewerIsMe}
          paidLocked={viewerPaidLocked}
          tempRestricted={viewerTempRestricted}
          isViewOnce={viewerMsg.temporary === "view_once"}
          timerSeconds={viewerMsg.temporary && viewerMsg.temporary !== "view_once" ? viewerMsg.temporary : undefined}
          timerRemaining={viewerTimerRemaining}
          onClose={closeMediaViewer}
          onReply={() => { setReplyTo(viewerMsg); closeMediaViewer(); }}
          onForward={() => { setForwardMsg(viewerMsg); closeMediaViewer(); }}
          onSave={() => showToast("Saved to gallery")}
          onPay={handlePayInViewer}
          showUnlockAnimation={showUnlockAnim}
          onUnlockAnimationComplete={() => setShowUnlockAnim(false)}
          album={viewerAlbum.length > 1 ? viewerAlbum : undefined}
          albumIndex={viewerAlbumIndex}
          onAlbumIndexChange={setViewerAlbumIndex}
        />
      )}
    </div>
  );
}
