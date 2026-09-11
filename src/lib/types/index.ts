export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  cover?: string;
  bio?: string;
  verified?: boolean;
  followers: number;
  following: number;
  postsCount: number;
}

export interface PostMedia {
  type: "image" | "video";
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
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  liked?: boolean;
  bookmarked?: boolean;
  topDonators?: Donator[];
}

export interface Donator {
  rank: number;
  user: User;
  stars: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: "text" | "image" | "video";
  content: string;
  objectKey?: string;
  createdAt: string;
  read: boolean;
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
