import { Post } from "@/lib/types";
import { mockUsers } from "./users";

export const mockPosts: Post[] = [
  {
    id: "p1",
    author: mockUsers[1],
    content: "Just shipped a new feature on Sheytoni! The Telegram Stars integration is going to change how creators get supported. 🌟",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    likes: 1243,
    comments: 89,
    views: 15420,
    shares: 234,
    topDonators: [
      { rank: 1, user: mockUsers[5], stars: 5000 },
      { rank: 2, user: mockUsers[6], stars: 2500 },
      { rank: 3, user: mockUsers[7], stars: 1000 },
    ],
  },
  {
    id: "p2",
    author: mockUsers[2],
    content: "Minimal design is not about having less. It's about making every element count.",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
        objectKey: "posts/p2/img_001.webp",
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likes: 567,
    comments: 34,
    views: 8900,
    shares: 45,
    topDonators: [
      { rank: 1, user: mockUsers[6], stars: 1200 },
      { rank: 2, user: mockUsers[7], stars: 800 },
      { rank: 3, user: mockUsers[5], stars: 500 },
    ],
  },
  {
    id: "p3",
    author: mockUsers[3],
    content: "Golden hour in the city. Sometimes the best shots happen when you least expect them.",
    media: [
      {
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=450&fit=crop",
        objectKey: "posts/p3/vid_001.mp4",
      },
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    likes: 3421,
    comments: 156,
    views: 45600,
    shares: 890,
    topDonators: [
      { rank: 1, user: mockUsers[5], stars: 8000 },
      { rank: 2, user: mockUsers[6], stars: 3200 },
      { rank: 3, user: mockUsers[7], stars: 1500 },
    ],
  },
  {
    id: "p4",
    author: mockUsers[4],
    content: "The future of social media is decentralized, creator-first, and community-driven. Sheytoni is leading the way.",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    likes: 890,
    comments: 67,
    views: 12300,
    shares: 123,
  },
  {
    id: "p5",
    author: mockUsers[1],
    content: "Working on something exciting. Stay tuned! 👀",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
        objectKey: "posts/p5/img_001.webp",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1461740680684-dccba630e2f6?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1461740680684-dccba630e2f6?w=400&h=300&fit=crop",
        objectKey: "posts/p5/img_002.webp",
      },
    ],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    likes: 2100,
    comments: 98,
    views: 28900,
    shares: 456,
    topDonators: [
      { rank: 1, user: mockUsers[7], stars: 3000 },
      { rank: 2, user: mockUsers[5], stars: 2000 },
      { rank: 3, user: mockUsers[6], stars: 1000 },
    ],
  },
  {
    id: "p6",
    author: mockUsers[2],
    content: "Clean UI, fast performance, zero clutter. That's the Sheytoni way.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 445,
    comments: 23,
    views: 6700,
    shares: 34,
  },
];

export const trendingTopics = [
  { id: "t1", tag: "#Sheytoni", posts: 12400 },
  { id: "t2", tag: "#TelegramStars", posts: 8900 },
  { id: "t3", tag: "#WebDev", posts: 5600 },
  { id: "t4", tag: "#MinimalDesign", posts: 3400 },
  { id: "t5", tag: "#CreatorEconomy", posts: 2100 },
];

export const categories = [
  "All",
  "Technology",
  "Design",
  "Photography",
  "Crypto",
  "Music",
  "Gaming",
];
