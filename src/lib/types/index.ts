export type Orientation =
  | "straight"
  | "gay"
  | "lesbian"
  | "bisexual"
  | "trans"
  | "pansexual"
  | "asexual"
  | "queer";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  cover?: string;
  bio?: string;
  verified?: boolean;
  premium?: boolean;
  followers: number;
  following: number;
  postsCount: number;
  age?: number;
  orientation?: Orientation;
  createdAt?: string;
  usernameChanges?: number;
  lastSeen?: string;
}

export interface PostMedia {
  type: "image" | "video" | "gif";
  url: string;
  thumbnail?: string;
  objectKey: string;
  width?: number;
  height?: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  media?: PostMedia[];
  category?: string;
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  stars?: number;
  liked?: boolean;
  bookmarked?: boolean;
  topDonators?: Donator[];
}

export interface Donator {
  rank: number;
  user: User;
  stars: number;
  anonymous?: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: "text" | "image" | "video" | "gif";
  content: string;
  objectKey?: string;
  createdAt: string;
  read: boolean;
  delivered?: boolean;
  replyTo?: string;
  pinned?: boolean;
  spoiler?: boolean;
  paidStars?: number;
  paidUnlocked?: boolean;
  caption?: string;
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface MediaObject {
  objectKey: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface UploadValidation {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface PostDonationState {
  total: number;
  topDonators: Donator[];
  userDonated?: boolean;
}

export interface PrototypeState {
  following: string[];
  blocked: string[];
  interestedPosts: string[];
  interestedAuthors: string[];
  notInterestedPosts: string[];
  notInterestedAuthors: string[];
  hiddenPosts: string[];
  donations: Record<string, PostDonationState>;
  likes: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  savedReels: string[];
  chatUnread: number;
  notificationUnread: number;
  deletedChats: string[];
  earnings: number;
}
