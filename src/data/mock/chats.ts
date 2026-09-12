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
  {
    id: "c5",
    participant: mockUsers[5],
    lastMessage: {
      id: "m5",
      chatId: "c5",
      senderId: mockUsers[5].id,
      type: "text",
      content: "Sent you 100 Stars for the last post!",
      createdAt: new Date(now - 120000).toISOString(),
      read: false,
    },
    unreadCount: 1,
  },
  {
    id: "c6",
    participant: mockUsers[9],
    lastMessage: {
      id: "m6",
      chatId: "c6",
      senderId: mockUsers[9].id,
      type: "gif",
      content: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop",
      createdAt: new Date(now - 5400000).toISOString(),
      read: true,
    },
    unreadCount: 0,
  },
];

const IMG = {
  city: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
  sunset: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  mountains: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
  neon: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop",
  portrait: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop",
};

export const mockMessages: Record<string, ChatMessage[]> = {
  c1: [
    { id: "c1m1", chatId: "c1", senderId: mockUsers[1].id, type: "text", content: "Hi! How's the Sheytoni launch going?", createdAt: new Date(now - 7200000).toISOString(), read: true },
    { id: "c1m2", chatId: "c1", senderId: "u1", type: "text", content: "Going great! Just finished the feed UI.", createdAt: new Date(now - 7000000).toISOString(), read: true },
    { id: "c1m3", chatId: "c1", senderId: mockUsers[1].id, type: "text", content: "Awesome! The design looks really clean.", createdAt: new Date(now - 6800000).toISOString(), read: true },
    { id: "c1m4", chatId: "c1", senderId: "u1", type: "text", content: "Thanks! We focused on minimal and fast.", createdAt: new Date(now - 6600000).toISOString(), read: true },
    { id: "c1m5", chatId: "c1", senderId: mockUsers[1].id, type: "image", content: IMG.portrait, paidStars: 50, caption: "Exclusive shot — 50 Stars to unlock", createdAt: new Date(now - 600000).toISOString(), read: false },
    { id: "c1m5b", chatId: "c1", senderId: mockUsers[1].id, type: "image", content: IMG.neon, paidStars: 120, caption: "Neon set — 120 Stars", createdAt: new Date(now - 550000).toISOString(), read: false },
    { id: "c1m5c", chatId: "c1", senderId: mockUsers[1].id, type: "image", content: IMG.beach, temporary: "10s", caption: "10 second beach snap", createdAt: new Date(now - 500000).toISOString(), read: false },
    { id: "c1m5d", chatId: "c1", senderId: mockUsers[1].id, type: "image", content: IMG.mountains, paidStars: 200, temporary: "30s", caption: "Paid + temporary combo", createdAt: new Date(now - 450000).toISOString(), read: false },
    { id: "c1m6", chatId: "c1", senderId: mockUsers[1].id, type: "text", content: "Hey! Did you see the new Stars feature?", createdAt: new Date(now - 300000).toISOString(), read: false },
  ],
  c2: [
    { id: "c2m1", chatId: "c2", senderId: mockUsers[2].id, type: "text", content: "I updated the color palette for dark mode", createdAt: new Date(now - 14400000).toISOString(), read: true },
    { id: "c2m2", chatId: "c2", senderId: "u1", type: "text", content: "Looks perfect! The contrast is much better now.", createdAt: new Date(now - 14000000).toISOString(), read: true },
    { id: "c2m3", chatId: "c2", senderId: mockUsers[2].id, type: "image", content: IMG.sunset, temporary: "30s", caption: "30 second photo", createdAt: new Date(now - 9000000).toISOString(), read: true },
    { id: "c2m4", chatId: "c2", senderId: "u1", type: "text", content: "Thanks for the design feedback!", createdAt: new Date(now - 3600000).toISOString(), read: true },
  ],
  c3: [
    { id: "c3m1", chatId: "c3", senderId: mockUsers[3].id, type: "text", content: "Check out this shot from yesterday", createdAt: new Date(now - 10800000).toISOString(), read: true },
    { id: "c3m2", chatId: "c3", senderId: mockUsers[3].id, type: "image", content: IMG.city, objectKey: "chats/c3/img_001.webp", createdAt: new Date(now - 7200000).toISOString(), read: true },
    { id: "c3m3", chatId: "c3", senderId: mockUsers[3].id, type: "image", content: IMG.beach, temporary: "10s", createdAt: new Date(now - 5400000).toISOString(), read: true },
    { id: "c3m4", chatId: "c3", senderId: "u1", type: "image", content: IMG.mountains, paidStars: 25, temporary: "3s", createdAt: new Date(now - 3600000).toISOString(), read: true },
  ],
  c4: [
    { id: "c4m1", chatId: "c4", senderId: mockUsers[4].id, type: "text", content: "I have some ideas for the explore page", createdAt: new Date(now - 172800000).toISOString(), read: true },
    { id: "c4m2", chatId: "c4", senderId: "u1", type: "text", content: "Would love to hear them!", createdAt: new Date(now - 169200000).toISOString(), read: true },
    { id: "c4m3", chatId: "c4", senderId: mockUsers[4].id, type: "image", content: IMG.neon, paidStars: 100, caption: "Premium content — 100 Stars", createdAt: new Date(now - 86400000).toISOString(), read: true },
  ],
  c5: [
    { id: "c5m1", chatId: "c5", senderId: mockUsers[5].id, type: "text", content: "Love your latest reel!", createdAt: new Date(now - 3600000).toISOString(), read: true },
    { id: "c5m2", chatId: "c5", senderId: "u1", type: "text", content: "Thanks Amir! Glad you enjoyed it.", createdAt: new Date(now - 1800000).toISOString(), read: true },
    { id: "c5m3", chatId: "c5", senderId: mockUsers[5].id, type: "image", content: IMG.portrait, temporary: "view_once", createdAt: new Date(now - 900000).toISOString(), read: false },
    { id: "c5m3b", chatId: "c5", senderId: mockUsers[5].id, type: "image", content: IMG.neon, paidStars: 40, caption: "Quick paid preview — 40 Stars", createdAt: new Date(now - 850000).toISOString(), read: false },
    { id: "c5m3c", chatId: "c5", senderId: mockUsers[5].id, type: "image", content: IMG.sunset, temporary: "3s", createdAt: new Date(now - 800000).toISOString(), read: false },
    { id: "c5m4", chatId: "c5", senderId: mockUsers[5].id, type: "text", content: "Sent you 100 Stars for the last post!", createdAt: new Date(now - 120000).toISOString(), read: false },
  ],
  c6: [
    { id: "c6m1", chatId: "c6", senderId: mockUsers[9].id, type: "text", content: "meow", createdAt: new Date(now - 7200000).toISOString(), read: true },
    { id: "c6m2", chatId: "c6", senderId: "u1", type: "text", content: "Hey Meow! What's up?", createdAt: new Date(now - 6000000).toISOString(), read: true },
    { id: "c6m3", chatId: "c6", senderId: mockUsers[9].id, type: "image", content: IMG.beach, temporary: "3s", createdAt: new Date(now - 5400000).toISOString(), read: true },
    { id: "c6m4", chatId: "c6", senderId: mockUsers[9].id, type: "image", content: IMG.sunset, paidStars: 75, createdAt: new Date(now - 4800000).toISOString(), read: true },
  ],
};
