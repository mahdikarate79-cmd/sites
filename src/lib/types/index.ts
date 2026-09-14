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
  username?: string;
  displayName: string;
  avatar: string;
  cover?: string;
  bio?: string;
  verified?: boolean;
  premium?: boolean;
  deleted?: boolean;
  loginMethod?: "telegram" | "guest";
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

export interface PostPrivacy {
  enabled?: boolean;
  followersOnly?: boolean;
  followingOnly?: boolean;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  media?: PostMedia[];
  category?: string;
  tags?: string[];
  paidStars?: number;
  privacy?: PostPrivacy;
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

export interface ChatMediaItem {
  type: "image" | "video" | "gif";
  url: string;
  rotation?: number;
}

export type TemporaryMode = "view_once" | "3s" | "10s" | "30s";

export interface ForwardInfo {
  userId: string;
  displayName: string;
  username: string;
  preview: string;
}

export type SendStatus = "sending" | "sent" | "failed";

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorAvatar: string;
  authorVerified?: boolean;
  authorPremium?: boolean;
  content: string;
  createdAt: string;
  sendStatus?: SendStatus;
  clientId?: string;
  replyTo?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: "text" | "image" | "video" | "gif" | "album";
  content: string;
  objectKey?: string;
  createdAt: string;
  read: boolean;
  delivered?: boolean;
  sendStatus?: SendStatus;
  clientId?: string;
  replyTo?: string;
  pinned?: boolean;
  pinnedScope?: "me" | "both";
  spoiler?: boolean;
  paidStars?: number;
  paidUnlocked?: boolean;
  caption?: string;
  rotation?: number;
  mirrored?: boolean;
  album?: ChatMediaItem[];
  groupId?: string;
  temporary?: TemporaryMode;
  viewed?: boolean;
  expiresAt?: number;
  forwardedFrom?: ForwardInfo;
}

export interface PinnedMessageInfo {
  messageId: string;
  scope: "me" | "both";
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage: ChatMessage;
  unreadCount: number;
  pinned?: PinnedMessageInfo;
}

export interface GalleryItem {
  id: string;
  type: "image" | "video" | "gif";
  url: string;
  thumbnail?: string;
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

export type TransactionType =
  | "donation"
  | "paid_media"
  | "withdrawal"
  | "premium"
  | "ads"
  | "subscription";

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: number;
  label: string;
  date: string;
  from?: string;
  to?: string;
  hash?: string;
  status?: "completed" | "pending";
  postId?: string;
}

export type NotificationType = "follow" | "like" | "comment" | "donation";

export interface AppNotification {
  id: string;
  type: NotificationType;
  user?: User;
  users?: User[];
  othersCount?: number;
  stars?: number;
  postId?: string;
  postThumbnail?: string;
  text: string;
  createdAt: string;
  read?: boolean;
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
  starBalance: number;
  transactions: TransactionRecord[];
  unlockedPaidMedia: Record<string, string[]>;
  expiredTempMedia: Record<string, string[]>;
  viewedTempMedia: Record<string, string[]>;
  tempMediaOpenedAt: Record<string, Record<string, number>>;
  comments: Record<string, Comment[]>;
  commentCounts: Record<string, number>;
  profileEdits: Partial<User>;
  userPosts: Post[];
  unlockedPaidPosts: string[];
}
