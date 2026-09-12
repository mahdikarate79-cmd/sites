import { ChatMessage } from "@/lib/types";

const STORAGE_KEY = "sheytoni-chat-messages";
const MAX_MESSAGES_PER_CHAT = 100;

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_PER_CHAT) return messages;
  return messages.slice(-MAX_MESSAGES_PER_CHAT);
}

function readAll(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadChatMessages(chatId: string, fallback: ChatMessage[]): ChatMessage[] {
  const stored = readAll()[chatId];
  if (!stored?.length) return fallback;
  const map = new Map<string, ChatMessage>();
  fallback.forEach((m) => map.set(m.id, m));
  stored.forEach((m) => map.set(m.id, m));
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function persistChatMessages(chatId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[chatId] = trimMessages(messages);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function appendPersistedMessage(chatId: string, message: ChatMessage, fallback: ChatMessage[]): ChatMessage[] {
  const current = loadChatMessages(chatId, fallback);
  const next = current.some((m) => m.id === message.id) ? current : [...current, message];
  persistChatMessages(chatId, next);
  return next;
}

export function replacePersistedMessage(
  chatId: string,
  clientId: string,
  message: ChatMessage,
  fallback: ChatMessage[]
): ChatMessage[] {
  const current = loadChatMessages(chatId, fallback);
  const next = current.map((m) => (m.clientId === clientId || m.id === clientId ? message : m));
  if (!next.some((m) => m.id === message.id)) next.push(message);
  persistChatMessages(chatId, next);
  return next;
}
