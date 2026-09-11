"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Donator, Post, PostDonationState, PrototypeState } from "@/lib/types";
import { loadState, saveState, getPostDonation } from "@/lib/store/prototypeStore";
import { currentUser } from "@/data/mock/users";

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
  withdrawEarnings: (amount: number) => boolean;
  filterPosts: (posts: Post[]) => Post[];
  sortPosts: (posts: Post[]) => Post[];
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
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

  const donate = useCallback((postId: string, stars: number, anonymous: boolean, authorId: string) => {
    update((s) => {
      const existing = getPostDonation(s, postId);
      const prevUser = existing.topDonators.find((d) => d.user.id === currentUser.id);
      const newDonator: Donator = {
        rank: 0,
        user: currentUser,
        stars: (prevUser?.stars ?? 0) + stars,
        anonymous,
      };
      const merged = [...existing.topDonators.filter((d) => d.user.id !== currentUser.id), newDonator]
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 3)
        .map((d, i) => ({ ...d, rank: i + 1 }));

      return {
        ...s,
        donations: {
          ...s.donations,
          [postId]: {
            total: existing.total + stars,
            topDonators: merged,
            userDonated: true,
          },
        },
        earnings: authorId === currentUser.id ? s.earnings : s.earnings,
      };
    });
  }, [update]);

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
    update((s) => ({ ...s, earnings: s.earnings + stars }));
  }, [update]);

  const withdrawEarnings = useCallback((amount: number): boolean => {
    if (amount <= 0 || amount > state.earnings) return false;
    update((s) => ({ ...s, earnings: s.earnings - amount }));
    return true;
  }, [update, state.earnings]);

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
        withdrawEarnings,
        filterPosts,
        sortPosts,
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
};

export function usePrototype() {
  const ctx = useContext(PrototypeContext);
  if (!ctx) throw new Error("usePrototype must be used within PrototypeProvider");
  return ctx;
}
