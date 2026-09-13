import crypto from "crypto";
import { findUserById, publicUser } from "./db.mjs";

export function ensureChats(db) {
  if (!db.chats) db.chats = {};
}

function chatIdFor(a, b) {
  return `chat_${[a, b].sort().join("_")}`;
}

function otherParticipant(chat, userId) {
  return chat.participantIds.find((id) => id !== userId);
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
  return raw.messages ?? [];
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

export function sendChatMessage(db, chatId, userId, body) {
  ensureChats(db);
  const chat = db.chats[chatId];
  if (!chat || !chat.participantIds?.includes(userId)) return { ok: false, error: "Chat not found" };
  const msg = {
    id: `m_${crypto.randomBytes(6).toString("hex")}`,
    chatId,
    senderId: userId,
    type: body.type ?? "text",
    content: String(body.content ?? ""),
    album: body.album,
    caption: body.caption,
    paidStars: body.paidStars,
    temporary: body.temporary,
    objectKey: body.objectKey,
    url: body.url,
    replyTo: body.replyTo,
    forwardedFrom: body.forwardedFrom,
    createdAt: new Date().toISOString(),
    read: false,
    sendStatus: "sent",
  };
  if (!chat.messages) chat.messages = [];
  chat.messages.push(msg);
  if (chat.messages.length > 200) chat.messages = chat.messages.slice(-200);
  chat.updatedAt = msg.createdAt;
  chat.lastMessage = msg;
  return { ok: true, message: msg };
}

function serializeChat(db, chat, viewerId) {
  const otherId = otherParticipant(chat, viewerId);
  const other = findUserById(db, otherId);
  if (!other) return null;
  const last = chat.lastMessage ?? chat.messages?.[chat.messages.length - 1];
  const unread = (chat.messages ?? []).filter((m) => m.senderId !== viewerId && !m.read).length;
  return {
    id: chat.id,
    participant: publicUser(other),
    lastMessage: last ?? {
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
