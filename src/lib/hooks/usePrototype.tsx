"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Comment, Donator, Post, PostDonationState, PrototypeState, User } from "@/lib/types";
import { canViewPostMedia, PostAccessContext, shouldShowInFeed } from "@/lib/utils/postAccess";
import { assertValidStarSpend, assertValidUnlock, sanitizePostContent, sanitizeTags } from "@/lib/security/validate";
import { loadState, saveState, getPostDonation, ensureStarBalance, createTransaction } from "@/lib/store/prototypeStore";
import { currentUser as baseCurrentUser } from "@/data/mock/users";
import { useAuth } from "@/lib/hooks/useAuth";

interface PrototypeContextValue {
  state: PrototypeState;
  isFollowing: (userId: string) => boolean;
  isBlocked: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  markInterested: (post: Post) => void;
  markNotInterested: (post: Post) => void;
  hidePost: (postId: string) => void;
  getDonation: (postId: string, initial?: PostDonationState) => PostDonationState;
  donate: (postId: string, stars: number, anonymous: boolean, authorId: string) => void;
  toggleLike: (postId: string) => boolean;
  toggleBookmark: (postId: string) => boolean;
  isLiked: (postId: string) => boolean;
  isBookmarked: (postId: string) => boolean;
  clearChatUnread: () => void;
  clearNotificationUnread: () => void;
  deleteChat: (chatId: string) => void;
  isChatDeleted: (chatId: string) => boolean;
  unlockPaidMedia: (stars: number) => void;
  spendStars: (stars: number, label: string, type?: "paid_media" | "premium") => boolean;
  withdrawEarnings: (amount: number) => boolean;
  getBookmarkedPosts: (allPosts: Post[]) => Post[];
  getCurrentUser: () => User;
  updateProfile: (edits: Partial<User>) => void;
  isPaidMediaUnlocked: (chatId: string, messageId: string) => boolean;
  unlockPaidMediaMessage: (chatId: string, messageId: string) => void;
  isTempMediaExpired: (chatId: string, messageId: string) => boolean;
  isTempMediaViewed: (chatId: string, messageId: string) => boolean;
  markTempMediaViewed: (chatId: string, messageId: string) => void;
  expireTempMedia: (chatId: string, messageId: string) => void;
  startTempMediaTimer: (chatId: string, messageId: string) => void;
  getTempMediaOpenedAt: (chatId: string, messageId: string) => number | null;
  getTempMediaRemaining: (chatId: string, messageId: string, mode: string) => number | null;
  getComments: (postId: string) => Comment[];
  getCommentCount: (postId: string, initial?: number) => number;
  addComment: (postId: string, content: string) => Comment;
  filterPosts: (posts: Post[]) => Post[];
  sortPosts: (posts: Post[]) => Post[];
  addPost: (post: Post) => void;
  isPaidPostUnlocked: (postId: string) => boolean;
  unlockPaidPost: (postId: string, stars: number) => boolean;
  canViewPost: (post: Post) => boolean;
  shouldShowInFeed: (post: Post) => boolean;
  getUserPosts: () => Post[];
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [state, setState] = useState<PrototypeState>(() =>
    typeof window !== "undefined" ? loadState() : DEFAULT_LOAD
  );

  const update = useCallback((fn: (s: PrototypeState) => PrototypeState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  const isFollowing = useCallback((userId: string) => state.following.includes(userId), [state.following]);
  const isBlocked = useCallback((userId: string) => state.blocked.includes(userId), [state.blocked]);

  const toggleFollow = useCallback((userId: string) => {
    update((s) => ({
      ...s,
      following: s.following.includes(userId)
        ? s.following.filter((id) => id !== userId)
        : [...s.following, userId],
    }));
  }, [update]);

  const blockUser = useCallback((userId: string) => {
    update((s) => ({
      ...s,
      blocked: [...new Set([...s.blocked, userId])],
      following: s.following.filter((id) => id !== userId),
    }));
  }, [update]);

  const unblockUser = useCallback((userId: string) => {
    update((s) => ({
      ...s,
      blocked: s.blocked.filter((id) => id !== userId),
    }));
  }, [update]);

  const markInterested = useCallback((post: Post) => {
    update((s) => ({
      ...s,
      interestedPosts: [...new Set([...s.interestedPosts, post.id])],
      interestedAuthors: [...new Set([...s.interestedAuthors, post.author.id])],
    }));
  }, [update]);

  const markNotInterested = useCallback((post: Post) => {
    update((s) => ({
      ...s,
      notInterestedPosts: [...new Set([...s.notInterestedPosts, post.id])],
      notInterestedAuthors: [...new Set([...s.notInterestedAuthors, post.author.id])],
      hiddenPosts: [...new Set([...s.hiddenPosts, post.id])],
    }));
  }, [update]);

  const hidePost = useCallback((postId: string) => {
    update((s) => ({
      ...s,
      hiddenPosts: [...new Set([...s.hiddenPosts, postId])],
    }));
  }, [update]);

  const getDonation = useCallback(
    (postId: string, initial?: PostDonationState) => getPostDonation(state, postId, initial),
    [state]
  );

  const resolveUser = useCallback((): User => {
    if (authUser) return { ...authUser, ...state.profileEdits, premium: authUser.premium };
    return { ...baseCurrentUser, ...state.profileEdits };
  }, [authUser, state.profileEdits]);

  const donate = useCallback((postId: string, stars: number, anonymous: boolean, authorId: string) => {
    update((s) => {
      const existing = getPostDonation(s, postId);
      const user = authUser ? { ...authUser, ...s.profileEdits, premium: authUser.premium } : { ...baseCurrentUser, ...s.profileEdits };
      const prevUser = existing.topDonators.find((d) => d.user.id === user.id);
      const newDonator: Donator = {
        rank: 0,
        user,
        stars: (prevUser?.stars ?? 0) + stars,
        anonymous,
      };
      const merged = [...existing.topDonators.filter((d) => d.user.id !== user.id), newDonator]
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 3)
        .map((d, i) => ({ ...d, rank: i + 1 }));

      const tx = createTransaction({
        type: "donation",
        amount: -stars,
        label: `Donation to @${postId}`,
        to: authorId,
        postId,
      });

      return {
        ...s,
        starBalance: ensureStarBalance(s.starBalance - stars),
        donations: {
          ...s.donations,
          [postId]: {
            total: existing.total + stars,
            topDonators: merged,
            userDonated: true,
          },
        },
        earnings: authorId === user.id ? s.earnings + stars : s.earnings,
        transactions: [tx, ...s.transactions].slice(0, 100),
      };
    });
  }, [update, authUser]);

  const toggleLike = useCallback((postId: string): boolean => {
    const current = state.likes[postId];
    const liked = !current;
    update((s) => ({ ...s, likes: { ...s.likes, [postId]: liked } }));
    return liked;
  }, [update, state.likes]);

  const toggleBookmark = useCallback((postId: string): boolean => {
    const bookmarked = !state.bookmarks[postId];
    update((s) => ({
      ...s,
      bookmarks: { ...s.bookmarks, [postId]: bookmarked },
    }));
    return bookmarked;
  }, [update, state.bookmarks]);

  const isLiked = useCallback((postId: string) => !!state.likes[postId], [state.likes]);
  const isBookmarked = useCallback((postId: string) => !!state.bookmarks[postId], [state.bookmarks]);

  const clearChatUnread = useCallback(() => {
    update((s) => ({ ...s, chatUnread: 0 }));
  }, [update]);

  const clearNotificationUnread = useCallback(() => {
    update((s) => ({ ...s, notificationUnread: 0 }));
  }, [update]);

  const deleteChat = useCallback((chatId: string) => {
    update((s) => ({
      ...s,
      deletedChats: [...new Set([...s.deletedChats, chatId])],
    }));
  }, [update]);

  const isChatDeleted = useCallback((chatId: string) => state.deletedChats.includes(chatId), [state.deletedChats]);

  const unlockPaidMedia = useCallback((stars: number) => {
    const tx = createTransaction({
      type: "paid_media",
      amount: stars,
      label: "Paid media unlock",
    });
    update((s) => ({
      ...s,
      earnings: s.earnings + stars,
      transactions: [tx, ...s.transactions].slice(0, 100),
    }));
  }, [update]);

  const spendStars = useCallback((stars: number, label: string, type: "paid_media" | "premium" = "paid_media"): boolean => {
    if (!assertValidStarSpend(stars, state.starBalance, `spend:${type}`)) return false;
    const tx = createTransaction({ type, amount: -stars, label });
    update((s) => ({
      ...s,
      starBalance: ensureStarBalance(s.starBalance - stars),
      transactions: [tx, ...s.transactions].slice(0, 100),
    }));
    return true;
  }, [update]);

  const withdrawEarnings = useCallback((amount: number): boolean => {
    if (amount <= 0 || amount > state.earnings) return false;
    const tx = createTransaction({
      type: "withdrawal",
      amount: -amount,
      label: "Withdrawal to TON wallet",
    });
    update((s) => ({
      ...s,
      earnings: s.earnings - amount,
      transactions: [tx, ...s.transactions].slice(0, 100),
    }));
    return true;
  }, [update, state.earnings]);

  const getBookmarkedPosts = useCallback(
    (allPosts: Post[]) => allPosts.filter((p) => state.bookmarks[p.id]),
    [state.bookmarks]
  );

  const getCurrentUser = useCallback((): User => resolveUser(), [resolveUser]);

  const updateProfile = useCallback((edits: Partial<User>) => {
    update((s) => ({ ...s, profileEdits: { ...s.profileEdits, ...edits } }));
  }, [update]);

  const isPaidMediaUnlocked = useCallback(
    (chatId: string, messageId: string) => (state.unlockedPaidMedia[chatId] ?? []).includes(messageId),
    [state.unlockedPaidMedia]
  );

  const unlockPaidMediaMessage = useCallback((chatId: string, messageId: string) => {
    update((s) => ({
      ...s,
      unlockedPaidMedia: {
        ...s.unlockedPaidMedia,
        [chatId]: [...new Set([...(s.unlockedPaidMedia[chatId] ?? []), messageId])],
      },
    }));
  }, [update]);

  const TEMP_SECONDS: Record<string, number> = { "3s": 3, "10s": 10, "30s": 30 };

  const isTempMediaExpired = useCallback(
    (chatId: string, messageId: string) => (state.expiredTempMedia[chatId] ?? []).includes(messageId),
    [state.expiredTempMedia]
  );

  const isTempMediaViewed = useCallback(
    (chatId: string, messageId: string) => (state.viewedTempMedia[chatId] ?? []).includes(messageId),
    [state.viewedTempMedia]
  );

  const markTempMediaViewed = useCallback((chatId: string, messageId: string) => {
    update((s) => ({
      ...s,
      viewedTempMedia: {
        ...s.viewedTempMedia,
        [chatId]: [...new Set([...(s.viewedTempMedia[chatId] ?? []), messageId])],
      },
    }));
  }, [update]);

  const expireTempMedia = useCallback((chatId: string, messageId: string) => {
    update((s) => ({
      ...s,
      expiredTempMedia: {
        ...s.expiredTempMedia,
        [chatId]: [...new Set([...(s.expiredTempMedia[chatId] ?? []), messageId])],
      },
    }));
  }, [update]);

  const startTempMediaTimer = useCallback((chatId: string, messageId: string) => {
    update((s) => ({
      ...s,
      tempMediaOpenedAt: {
        ...s.tempMediaOpenedAt,
        [chatId]: {
          ...(s.tempMediaOpenedAt[chatId] ?? {}),
          [messageId]: Date.now(),
        },
      },
    }));
  }, [update]);

  const getTempMediaOpenedAt = useCallback(
    (chatId: string, messageId: string) => state.tempMediaOpenedAt[chatId]?.[messageId] ?? null,
    [state.tempMediaOpenedAt]
  );

  const getTempMediaRemaining = useCallback(
    (chatId: string, messageId: string, mode: string): number | null => {
      const seconds = TEMP_SECONDS[mode];
      if (!seconds) return null;
      const openedAt = state.tempMediaOpenedAt[chatId]?.[messageId];
      if (!openedAt) return seconds;
      const remaining = Math.ceil(seconds - (Date.now() - openedAt) / 1000);
      return Math.max(0, remaining);
    },
    [state.tempMediaOpenedAt]
  );

  const getComments = useCallback(
    (postId: string) => state.comments[postId] ?? [],
    [state.comments]
  );

  const getCommentCount = useCallback(
    (postId: string, initial = 0) => state.commentCounts[postId] ?? initial,
    [state.commentCounts]
  );

  const addComment = useCallback((postId: string, content: string): Comment => {
    const user = authUser ? { ...authUser, ...state.profileEdits, premium: authUser.premium } : { ...baseCurrentUser, ...state.profileEdits };
    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      postId,
      authorId: user.id,
      authorName: user.displayName,
      authorAvatar: user.avatar,
      authorVerified: user.verified,
      authorPremium: user.premium,
      content,
      createdAt: new Date().toISOString(),
      sendStatus: "sent",
    };
    update((s) => ({
      ...s,
      comments: {
        ...s.comments,
        [postId]: [...(s.comments[postId] ?? []), comment],
      },
      commentCounts: {
        ...s.commentCounts,
        [postId]: (s.commentCounts[postId] ?? 0) + 1,
      },
    }));
    return comment;
  }, [update, state.profileEdits, authUser]);

  const filterPosts = useCallback(
    (posts: Post[]) =>
      posts.filter(
        (p) =>
          !state.hiddenPosts.includes(p.id) &&
          !state.notInterestedPosts.includes(p.id)
      ),
    [state.hiddenPosts, state.notInterestedPosts]
  );

  const sortPosts = useCallback(
    (posts: Post[]) => {
      return [...posts].sort((a, b) => {
        const scoreA =
          (state.interestedAuthors.includes(a.author.id) ? 100 : 0) -
          (state.notInterestedAuthors.includes(a.author.id) ? 50 : 0);
        const scoreB =
          (state.interestedAuthors.includes(b.author.id) ? 100 : 0) -
          (state.notInterestedAuthors.includes(b.author.id) ? 50 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    [state.interestedAuthors, state.notInterestedAuthors]
  );

  const isPaidPostUnlocked = useCallback(
    (postId: string) => state.unlockedPaidPosts.includes(postId),
    [state.unlockedPaidPosts]
  );

  const unlockPaidPost = useCallback((postId: string, stars: number): boolean => {
    if (!assertValidUnlock(postId, stars, state.starBalance, state.unlockedPaidPosts.includes(postId))) return false;
    const tx = createTransaction({ type: "paid_media", amount: -stars, label: "Paid post unlock", postId });
    update((s) => ({
      ...s,
      starBalance: ensureStarBalance(s.starBalance - stars),
      unlockedPaidPosts: [...new Set([...s.unlockedPaidPosts, postId])],
      transactions: [tx, ...s.transactions].slice(0, 100),
    }));
    return true;
  }, [update, state.starBalance]);

  const addPost = useCallback((post: Post) => {
    const safe: Post = {
      ...post,
      content: sanitizePostContent(post.content),
      tags: sanitizeTags(post.tags ?? []),
    };
    update((s) => ({
      ...s,
      userPosts: [safe, ...s.userPosts],
    }));
  }, [update]);

  const getUserPosts = useCallback(() => state.userPosts, [state.userPosts]);

  const accessCtx = useCallback((): PostAccessContext => {
    const user = authUser ? { ...authUser, ...state.profileEdits, premium: authUser.premium } : { ...baseCurrentUser, ...state.profileEdits };
    return { viewerId: user.id, isFollowing, isUnlocked: isPaidPostUnlocked };
  }, [state.profileEdits, authUser, isFollowing, isPaidPostUnlocked]);

  const canViewPostFn = useCallback(
    (post: Post) => canViewPostMedia(post, accessCtx()),
    [accessCtx]
  );

  const shouldShowInFeedFn = useCallback(
    (post: Post) => shouldShowInFeed(post, accessCtx()),
    [accessCtx]
  );

  return (
    <PrototypeContext.Provider
      value={{
        state,
        isFollowing,
        isBlocked,
        toggleFollow,
        blockUser,
        unblockUser,
        markInterested,
        markNotInterested,
        hidePost,
        getDonation,
        donate,
        toggleLike,
        toggleBookmark,
        isLiked,
        isBookmarked,
        clearChatUnread,
        clearNotificationUnread,
        deleteChat,
        isChatDeleted,
        unlockPaidMedia,
        spendStars,
        withdrawEarnings,
        getBookmarkedPosts,
        getCurrentUser,
        updateProfile,
        isPaidMediaUnlocked,
        unlockPaidMediaMessage,
        isTempMediaExpired,
        isTempMediaViewed,
        markTempMediaViewed,
        expireTempMedia,
        startTempMediaTimer,
        getTempMediaOpenedAt,
        getTempMediaRemaining,
        getComments,
        getCommentCount,
        addComment,
        filterPosts,
        sortPosts,
        addPost,
        isPaidPostUnlocked,
        unlockPaidPost,
        canViewPost: canViewPostFn,
        shouldShowInFeed: shouldShowInFeedFn,
        getUserPosts,
      }}
    >
      {children}
    </PrototypeContext.Provider>
  );
}

const DEFAULT_LOAD: PrototypeState = {
  following: [],
  blocked: [],
  interestedPosts: [],
  interestedAuthors: [],
  notInterestedPosts: [],
  notInterestedAuthors: [],
  hiddenPosts: [],
  donations: {},
  likes: {},
  bookmarks: {},
  savedReels: [],
  chatUnread: 3,
  notificationUnread: 10,
  deletedChats: [],
  earnings: 2500,
  starBalance: 999_999,
  transactions: [
    {
      id: "t1",
      type: "donation",
      amount: 150,
      label: "Donation from @alex",
      date: "2026-09-10T14:30:00Z",
      from: "u2",
      status: "completed",
      hash: "0xa1b2c3d4",
    },
  ],
  unlockedPaidMedia: {},
  expiredTempMedia: {},
  viewedTempMedia: {},
  tempMediaOpenedAt: {},
  comments: {},
  commentCounts: {},
  profileEdits: {},
  userPosts: [],
  unlockedPaidPosts: [],
};

export function usePrototype() {
  const ctx = useContext(PrototypeContext);
  if (!ctx) throw new Error("usePrototype must be used within PrototypeProvider");
  return ctx;
}
