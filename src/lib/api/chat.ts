import { Chat, ChatMessage, ChatMediaItem } from "@/lib/types";
import { mockChats, mockMessages } from "@/data/mock/chats";

const MAX_MESSAGES_PER_CHAT = 100;

function uniqueId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_PER_CHAT) return messages;
  return messages.slice(-MAX_MESSAGES_PER_CHAT);
}

export async function getChats(): Promise<Chat[]> {
  return mockChats;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  return mockMessages[chatId] ?? [];
}

export async function sendMessage(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt" | "read">
): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    ...message,
    id: uniqueId(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (!mockMessages[chatId]) mockMessages[chatId] = [];
  mockMessages[chatId].push(newMessage);
  mockMessages[chatId] = trimMessages(mockMessages[chatId]);

  const chat = mockChats.find((c) => c.id === chatId);
  if (chat) {
    chat.lastMessage = newMessage;
  }

  return newMessage;
}

export async function sendAlbumMessage(
  chatId: string,
  payload: {
    senderId: string;
    album: ChatMediaItem[];
    caption?: string;
    spoiler?: boolean;
    paidStars?: number;
    replyTo?: string;
    temporary?: ChatMessage["temporary"];
    rotation?: number;
    mirrored?: boolean;
  }
): Promise<ChatMessage> {
  const groupId = uniqueId();
  const newMessage: ChatMessage = {
    id: uniqueId(),
    chatId,
    senderId: payload.senderId,
    type: "album",
    content: payload.caption ?? "",
    album: payload.album,
    groupId,
    caption: payload.caption,
    spoiler: payload.spoiler,
    paidStars: payload.paidStars,
    replyTo: payload.replyTo,
    temporary: payload.temporary,
    rotation: payload.rotation,
    mirrored: payload.mirrored,
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (!mockMessages[chatId]) mockMessages[chatId] = [];
  mockMessages[chatId].push(newMessage);
  mockMessages[chatId] = trimMessages(mockMessages[chatId]);

  const chat = mockChats.find((c) => c.id === chatId);
  if (chat) {
    chat.lastMessage = newMessage;
  }

  return newMessage;
}

export async function forwardMessage(
  targetChatId: string,
  payload: {
    senderId: string;
    source: ChatMessage;
    forwardedFrom: ChatMessage["forwardedFrom"];
  }
): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    id: uniqueId(),
    chatId: targetChatId,
    senderId: payload.senderId,
    type: payload.source.type,
    content: payload.source.content,
    album: payload.source.album,
    caption: payload.source.caption,
    forwardedFrom: payload.forwardedFrom,
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (!mockMessages[targetChatId]) mockMessages[targetChatId] = [];
  mockMessages[targetChatId].push(newMessage);
  mockMessages[targetChatId] = trimMessages(mockMessages[targetChatId]);

  const chat = mockChats.find((c) => c.id === targetChatId);
  if (chat) chat.lastMessage = newMessage;

  return newMessage;
}

export { MAX_MESSAGES_PER_CHAT };
