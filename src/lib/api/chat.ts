import { Chat, ChatMessage, ChatMediaItem } from "@/lib/types";
import { getApiBase } from "./base";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getChats(): Promise<Chat[]> {
  const data = await apiFetch<{ chats: Chat[] }>("/api/chats");
  return data.chats ?? [];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  try {
    const data = await apiFetch<{ chat: Chat }>(`/api/chats/${encodeURIComponent(chatId)}`);
    return data.chat;
  } catch {
    return null;
  }
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const data = await apiFetch<{ messages: ChatMessage[] }>(
    `/api/chats/${encodeURIComponent(chatId)}/messages`
  );
  return data.messages ?? [];
}

export async function startChatWithUser(userId: string): Promise<Chat> {
  const data = await apiFetch<{ chat: Chat }>("/api/chats/start", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return data.chat;
}

export async function sendMessage(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt" | "read">
): Promise<ChatMessage> {
  const data = await apiFetch<{ message: ChatMessage }>(
    `/api/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        type: message.type,
        content: message.content,
        album: message.album,
        caption: message.caption,
        paidStars: message.paidStars,
        temporary: message.temporary,
        objectKey: message.objectKey,
        url: message.content,
        replyTo: message.replyTo,
        forwardedFrom: message.forwardedFrom,
        spoiler: message.spoiler,
        rotation: message.rotation,
        mirrored: message.mirrored,
      }),
    }
  );
  return data.message;
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
  return sendMessage(chatId, {
    chatId,
    senderId: payload.senderId,
    type: "album",
    content: payload.caption ?? "",
    album: payload.album,
    caption: payload.caption,
    spoiler: payload.spoiler,
    paidStars: payload.paidStars,
    replyTo: payload.replyTo,
    temporary: payload.temporary,
    rotation: payload.rotation,
    mirrored: payload.mirrored,
  });
}

export async function forwardMessage(
  targetChatId: string,
  payload: {
    senderId: string;
    source: ChatMessage;
    forwardedFrom: ChatMessage["forwardedFrom"];
  }
): Promise<ChatMessage> {
  return sendMessage(targetChatId, {
    chatId: targetChatId,
    senderId: payload.senderId,
    type: payload.source.type,
    content: payload.source.content,
    album: payload.source.album,
    caption: payload.source.caption,
    forwardedFrom: payload.forwardedFrom,
  });
}
