import { Chat, ChatMessage } from "@/lib/types";
import { mockUsers } from "./users";

const now = Date.now();

export const mockChats: Chat[] = [
  {
    id: "c1",
    participant: mockUsers[1],
    lastMessage: {
      id: "m1",
      chatId: "c1",
      senderId: mockUsers[1].id,
      type: "text",
      content: "Hey! Did you see the new Stars feature?",
      createdAt: new Date(now - 300000).toISOString(),
      read: false,
    },
    unreadCount: 2,
  },
  {
    id: "c2",
    participant: mockUsers[2],
    lastMessage: {
      id: "m2",
      chatId: "c2",
      senderId: "u1",
      type: "text",
      content: "Thanks for the design feedback!",
      createdAt: new Date(now - 3600000).toISOString(),
      read: true,
    },
    unreadCount: 0,
  },
  {
    id: "c3",
    participant: mockUsers[3],
    lastMessage: {
      id: "m3",
      chatId: "c3",
      senderId: mockUsers[3].id,
      type: "image",
      content: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
      objectKey: "chats/c3/img_001.webp",
      createdAt: new Date(now - 7200000).toISOString(),
      read: true,
    },
    unreadCount: 0,
  },
  {
    id: "c4",
    participant: mockUsers[4],
    lastMessage: {
      id: "m4",
      chatId: "c4",
      senderId: mockUsers[4].id,
      type: "text",
      content: "Let's collaborate on the next project",
      createdAt: new Date(now - 86400000).toISOString(),
      read: true,
    },
    unreadCount: 0,
  },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  c1: [
    { id: "c1m1", chatId: "c1", senderId: mockUsers[1].id, type: "text", content: "Hi! How's the Sheytoni launch going?", createdAt: new Date(now - 7200000).toISOString(), read: true },
    { id: "c1m2", chatId: "c1", senderId: "u1", type: "text", content: "Going great! Just finished the feed UI.", createdAt: new Date(now - 7000000).toISOString(), read: true },
    { id: "c1m3", chatId: "c1", senderId: mockUsers[1].id, type: "text", content: "Awesome! The design looks really clean.", createdAt: new Date(now - 6800000).toISOString(), read: true },
    { id: "c1m4", chatId: "c1", senderId: "u1", type: "text", content: "Thanks! We focused on minimal and fast.", createdAt: new Date(now - 6600000).toISOString(), read: true },
    { id: "c1m5", chatId: "c1", senderId: mockUsers[1].id, type: "text", content: "Hey! Did you see the new Stars feature?", createdAt: new Date(now - 300000).toISOString(), read: false },
  ],
  c2: [
    { id: "c2m1", chatId: "c2", senderId: mockUsers[2].id, type: "text", content: "I updated the color palette for dark mode", createdAt: new Date(now - 14400000).toISOString(), read: true },
    { id: "c2m2", chatId: "c2", senderId: "u1", type: "text", content: "Looks perfect! The contrast is much better now.", createdAt: new Date(now - 14000000).toISOString(), read: true },
    { id: "c2m3", chatId: "c2", senderId: mockUsers[2].id, type: "text", content: "Glad you like it. Let me know if you need more tweaks.", createdAt: new Date(now - 7200000).toISOString(), read: true },
    { id: "c2m4", chatId: "c2", senderId: "u1", type: "text", content: "Thanks for the design feedback!", createdAt: new Date(now - 3600000).toISOString(), read: true },
  ],
  c3: [
    { id: "c3m1", chatId: "c3", senderId: mockUsers[3].id, type: "text", content: "Check out this shot from yesterday", createdAt: new Date(now - 10800000).toISOString(), read: true },
    { id: "c3m2", chatId: "c3", senderId: mockUsers[3].id, type: "image", content: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop", objectKey: "chats/c3/img_001.webp", createdAt: new Date(now - 7200000).toISOString(), read: true },
  ],
  c4: [
    { id: "c4m1", chatId: "c4", senderId: mockUsers[4].id, type: "text", content: "I have some ideas for the explore page", createdAt: new Date(now - 172800000).toISOString(), read: true },
    { id: "c4m2", chatId: "c4", senderId: "u1", type: "text", content: "Would love to hear them!", createdAt: new Date(now - 169200000).toISOString(), read: true },
    { id: "c4m3", chatId: "c4", senderId: mockUsers[4].id, type: "text", content: "Let's collaborate on the next project", createdAt: new Date(now - 86400000).toISOString(), read: true },
  ],
};
