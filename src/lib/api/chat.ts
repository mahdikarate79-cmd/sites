import { Chat, ChatMessage, ChatMediaItem } from "@/lib/types";
import { apiFetch } from "./fetch";

export async function getChats(): Promise<Chat[]> {
  const data = await apiFetch<{ chats: Chat[] }>("/api/chats");
  return data.chats ?? [];
}

export async function getChat(chatId: string): Promise<{ chat: Chat; viewerId: string } | null> {
  try {
    const data = await apiFetch<{ chat: Chat; viewerId: string }>(`/api/chats/${encodeURIComponent(chatId)}`);
    return { chat: data.chat, viewerId: data.viewerId };
  } catch {
    return null;
  }
}

export async function getChatMessages(chatId: string): Promise<{ messages: ChatMessage[]; viewerId: string }> {
  const data = await apiFetch<{ messages: ChatMessage[]; viewerId: string }>(
    `/api/chats/${encodeURIComponent(chatId)}/messages`
  );
  return { messages: data.messages ?? [], viewerId: data.viewerId };
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

export async function expireChatMessage(chatId: string, messageId: string): Promise<void> {
  await apiFetch(
    `/api/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/expire`,
    { method: "POST" },
  );
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
