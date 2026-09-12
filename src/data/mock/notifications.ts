import { AppNotification } from "@/lib/types";
import { mockUsers } from "./users";

export const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    type: "follow",
    user: mockUsers.find((u) => u.username === "amir"),
    text: "started following you",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "n2",
    type: "like",
    users: [mockUsers.find((u) => u.username === "amir")!, mockUsers.find((u) => u.username === "ali")!],
    othersCount: 8,
    postId: "p2",
    postThumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
    text: "liked your post",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "n3",
    type: "comment",
    user: mockUsers.find((u) => u.username === "sara"),
    postId: "p1",
    postThumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
    text: "commented on your post",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "n4",
    type: "donation",
    user: mockUsers.find((u) => u.username === "meow"),
    stars: 100,
    postId: "p2",
    postThumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
    text: "donated Stars to your post",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "n5",
    type: "follow",
    user: mockUsers.find((u) => u.username === "reza"),
    text: "started following you",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];
