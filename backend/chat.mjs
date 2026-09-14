import crypto from "crypto";
import { findUserById, publicUser } from "./db.mjs";
import { MIN_STARS_PAYMENT } from "./constants.mjs";
import { config } from "./config.mjs";
import { deleteMediaObject } from "./mediaCleanup.mjs";

export const CHAT_MESSAGE_LIMIT = 50;

export function ensureChats(db) {
  if (!db.chats) db.chats = {};
}

function chatIdFor(a, b) {
  return `chat_${[a, b].sort().join("_")}`;
}

function otherParticipant(chat, userId) {
  return chat.participantIds.find((id) => id !== userId);
}

function mediaProxyUrl(objectKey) {
  if (!objectKey) return null;
  return `${config.apiUrl}/api/media/${encodeURIComponent(objectKey)}`;
}

function resolveMessageMedia(msg) {
  const out = { ...msg };
  if (out.objectKey) {
    out.url = mediaProxyUrl(out.objectKey);
  } else if (out.url && (out.url.startsWith("blob:") || out.url.startsWith("data:"))) {
    out.url = null;
  }
  if (out.album) {
    out.album = out.album.map((item) => {
      if (item.objectKey) return { ...item, url: mediaProxyUrl(item.objectKey) };
      if (item.url?.startsWith("blob:") || item.url?.startsWith("data:")) return { ...item, url: null };
      return item;
    });
  }
  if (out.type !== "text" && out.url) out.content = out.url;
  return out;
}

export function serializeChatMessage(msg) {
  if (!msg) return msg;
  if (msg.senderDeleted || msg.senderId === "deleted") {
    return {
      ...resolveMessageMedia(msg),
      senderId: "deleted",
      senderDeleted: true,
    };
  }
  return resolveMessageMedia(msg);
}

async function purgeMessageMedia(db, msg) {
  if (!msg || msg.mediaExpired) return;
  if (msg.objectKey) {
    await deleteMediaObject(db, { objectKey: msg.objectKey });
    msg.mediaExpired = true;
    msg.url = null;
  }
  if (msg.album) {
    for (const item of msg.album) {
      if (item.objectKey) {
        await deleteMediaObject(db, { objectKey: item.objectKey });
        item.url = null;
      }
    }
  }
}

export async function trimChatMessages(db, chat) {
  if (!chat?.messages?.length) return;
  while (chat.messages.length > CHAT_MESSAGE_LIMIT) {
    const removed = chat.messages.shift();
    await purgeMessageMedia(db, removed);
  }
}

export function listChats(db, userId) {
  ensureChats(db);
  const items = Object.values(db.chats)
    .filter((c) => c.participantIds?.includes(userId))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return items.map((c) => serializeChat(db, c, userId)).filter(Boolean);
}

export function getChat(db, chatId, userId) {
  ensureChats(db);
  const chat = db.chats[chatId];
  if (!chat || !chat.participantIds?.includes(userId)) return null;
  return serializeChat(db, chat, userId);
}

export function getChatMessages(db, chatId, userId) {
  const chat = getChat(db, chatId, userId);
  if (!chat) return null;
  const raw = db.chats[chatId];
  return (raw.messages ?? [])
    .filter((m) => !m.expired)
    .map(serializeChatMessage);
}

export function startChat(db, userId, otherUserId) {
  ensureChats(db);
  if (userId === otherUserId) return { ok: false, error: "Invalid chat" };
  const other = findUserById(db, otherUserId);
  if (!other) return { ok: false, error: "User not found" };
  const id = chatIdFor(userId, otherUserId);
  if (!db.chats[id]) {
    db.chats[id] = {
      id,
      participantIds: [userId, otherUserId],
      messages: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
  return { ok: true, chat: serializeChat(db, db.chats[id], userId) };
}

function normalizeAlbum(body) {
  if (!body.album?.length) return body.album;
  return body.album.map((item) => ({
    type: item.type ?? "image",
    objectKey: item.objectKey ?? null,
    url: item.url ?? null,
    rotation: item.rotation,
  }));
}

export async function sendChatMessage(db, chatId, userId, body) {
  ensureChats(db);
  const chat = db.chats[chatId];
  if (!chat || !chat.participantIds?.includes(userId)) return { ok: false, error: "Chat not found" };
  if (body.paidStars && Number(body.paidStars) < MIN_STARS_PAYMENT) {
    return { ok: false, error: `Minimum ${MIN_STARS_PAYMENT} stars required` };
  }

  const objectKey = body.objectKey ? String(body.objectKey) : null;
  if (objectKey && !objectKey.startsWith("chat/")) {
    return { ok: false, error: "Invalid media" };
  }
  if (objectKey && !db.mediaObjects?.[objectKey]) {
    return { ok: false, error: "Media not found" };
  }

  const album = normalizeAlbum(body);
  if (album?.length) {
    for (const item of album) {
      if (item.objectKey && !item.objectKey.startsWith("chat/")) {
        return { ok: false, error: "Invalid album media" };
      }
    }
  }

  const contentUrl = objectKey ? mediaProxyUrl(objectKey) : String(body.content ?? body.url ?? "");
  if (contentUrl.startsWith("blob:") || contentUrl.startsWith("data:")) {
    return { ok: false, error: "Upload media via storage API" };
  }

  const msg = {
    id: `m_${crypto.randomBytes(6).toString("hex")}`,
    chatId,
    senderId: userId,
    type: body.type ?? "text",
    content: body.type === "text" ? String(body.content ?? "") : contentUrl,
    album,
    caption: body.caption,
    paidStars: body.paidStars,
    temporary: body.temporary,
    objectKey,
    url: objectKey ? mediaProxyUrl(objectKey) : null,
    replyTo: body.replyTo,
    forwardedFrom: body.forwardedFrom,
    rotation: body.rotation,
    mirrored: body.mirrored,
    spoiler: body.spoiler,
    createdAt: new Date().toISOString(),
    read: false,
    sendStatus: "sent",
  };

  if (!chat.messages) chat.messages = [];
  chat.messages.push(msg);
  await trimChatMessages(db, chat);
  chat.updatedAt = msg.createdAt;
  chat.lastMessage = msg;
  return { ok: true, message: serializeChatMessage(msg) };
}

export async function expireChatMessage(db, chatId, messageId, userId) {
  ensureChats(db);
  const chat = db.chats[chatId];
  if (!chat || !chat.participantIds?.includes(userId)) return { ok: false, error: "Chat not found" };
  const msg = (chat.messages ?? []).find((m) => m.id === messageId);
  if (!msg) return { ok: false, error: "Message not found" };
  if (msg.senderId === userId) return { ok: true, expired: false };
  if (!msg.temporary) return { ok: false, error: "Not temporary media" };
  msg.expired = true;
  msg.expiredAt = new Date().toISOString();
  msg.expiredBy = userId;
  await purgeMessageMedia(db, msg);
  return { ok: true, expired: true };
}

export function listChatMediaForAdmin(db) {
  ensureChats(db);
  const items = [];
  for (const chat of Object.values(db.chats ?? {})) {
    for (const msg of chat.messages ?? []) {
      const keys = [];
      if (msg.objectKey) keys.push({ objectKey: msg.objectKey, type: msg.type });
      if (msg.album) {
        for (const a of msg.album) {
          if (a.objectKey) keys.push({ objectKey: a.objectKey, type: a.type });
        }
      }
      for (const media of keys) {
        const meta = db.mediaObjects?.[media.objectKey];
        items.push({
          chatId: chat.id,
          messageId: msg.id,
          objectKey: media.objectKey,
          type: media.type,
          size: meta?.size ?? 0,
          url: mediaProxyUrl(media.objectKey),
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          expired: !!msg.expired || !!msg.mediaExpired,
        });
      }
    }
  }
  return items;
}

const DELETED_PARTICIPANT = {
  id: "deleted",
  displayName: "Deleted Account",
  username: null,
  avatar: "",
  verified: false,
  premium: false,
  deleted: true,
};

function serializeChat(db, chat, viewerId) {
  const otherId = otherParticipant(chat, viewerId);
  const found = findUserById(db, otherId);
  const other = found ?? DELETED_PARTICIPANT;
  const last = chat.lastMessage ?? chat.messages?.[chat.messages.length - 1];
  const unread = (chat.messages ?? []).filter((m) => m.senderId !== viewerId && !m.read && !m.expired).length;
  return {
    id: chat.id,
    participant: publicUser(other),
    lastMessage: last ? serializeChatMessage(last) : {
      id: "empty",
      chatId: chat.id,
      senderId: viewerId,
      type: "text",
      content: "",
      createdAt: chat.createdAt,
      read: true,
    },
    unreadCount: unread,
    updatedAt: chat.updatedAt,
  };
}
