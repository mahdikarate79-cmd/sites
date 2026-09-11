import { Chat, ChatMessage } from "@/lib/types";
import { mockChats, mockMessages } from "@/data/mock/chats";

const MAX_MESSAGES_PER_CHAT = 100;

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_PER_CHAT) return messages;
  return messages.slice(-MAX_MESSAGES_PER_CHAT);
}

export async function getChats(): Promise<Chat[]> {
  // TODO: GET /api/chats
  return mockChats;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  // TODO: GET /api/chats/:id/messages?limit=100
  return mockMessages[chatId] ?? [];
}

export async function sendMessage(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt" | "read">
): Promise<ChatMessage> {
  // TODO: POST /api/chats/:id/messages
  const newMessage: ChatMessage = {
    ...message,
    id: `msg_${Date.now()}`,
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

export { MAX_MESSAGES_PER_CHAT };
