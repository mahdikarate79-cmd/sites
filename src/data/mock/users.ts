import { User } from "@/lib/types";

export const currentUser: User = {
  id: "u1",
  username: "sheytoni_user",
  displayName: "Sheytoni User",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sheytoni",
  cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop",
  bio: "Building the future of social media. 🚀",
  verified: true,
  followers: 12400,
  following: 342,
  postsCount: 89,
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: "u2",
    username: "alex_dev",
    displayName: "Alex Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Full-stack developer | Open source enthusiast",
    verified: true,
    followers: 45200,
    following: 890,
    postsCount: 234,
  },
  {
    id: "u3",
    username: "sara_design",
    displayName: "Sara Miller",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sara",
    bio: "UI/UX Designer creating beautiful experiences",
    verified: false,
    followers: 8900,
    following: 456,
    postsCount: 156,
  },
  {
    id: "u4",
    username: "mike_photo",
    displayName: "Mike Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Photographer & visual storyteller 📸",
    verified: true,
    followers: 67800,
    following: 234,
    postsCount: 567,
  },
  {
    id: "u5",
    username: "luna_crypto",
    displayName: "Luna Park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna",
    bio: "Tech & crypto insights",
    verified: false,
    followers: 23400,
    following: 1200,
    postsCount: 445,
  },
  {
    id: "u6",
    username: "donor_gold",
    displayName: "Gold Supporter",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=gold",
    verified: false,
    followers: 1200,
    following: 50,
    postsCount: 12,
  },
  {
    id: "u7",
    username: "donor_silver",
    displayName: "Silver Fan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=silver",
    verified: false,
    followers: 800,
    following: 30,
    postsCount: 8,
  },
  {
    id: "u8",
    username: "donor_bronze",
    displayName: "Bronze Member",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bronze",
    verified: false,
    followers: 500,
    following: 20,
    postsCount: 5,
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return mockUsers.find((u) => u.username === username);
}
