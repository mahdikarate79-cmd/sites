"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { User, Post } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { PostCard } from "@/components/feed/PostCard";
import { formatCount } from "@/lib/utils/format";
import { getPostsByUser } from "@/lib/api/posts";
import { currentUser } from "@/data/mock/users";

interface ProfileContentProps {
  user: User;
  isOwnProfile?: boolean;
}

export function ProfileContent({ user, isOwnProfile }: ProfileContentProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    getPostsByUser(user.id).then(setPosts);
  }, [user.id]);

  return (
    <div>
      <div className="relative h-32 sm:h-40 bg-surface">
        {user.cover && (
          <Image src={user.cover} alt="Cover" fill className="object-cover" priority sizes="100vw" />
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-3">
          <Avatar src={user.avatar} alt={user.displayName} size="xl" className="border-4 border-bg" />
          {isOwnProfile ? (
            <button className="px-4 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-surface transition-colors">
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setFollowing(!following)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                following
                  ? "border border-border hover:bg-surface"
                  : "bg-text text-bg hover:opacity-90"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 mb-0.5">
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          {user.verified && <VerifiedBadge className="w-5 h-5" />}
        </div>
        <p className="text-text-muted text-sm mb-2">@{user.username}</p>
        {user.bio && <p className="text-sm mb-3 leading-relaxed">{user.bio}</p>}

        <div className="flex gap-4 text-sm">
          <span><strong>{formatCount(user.following)}</strong> <span className="text-text-muted">Following</span></span>
          <span><strong>{formatCount(user.followers)}</strong> <span className="text-text-muted">Followers</span></span>
          <span><strong>{formatCount(user.postsCount)}</strong> <span className="text-text-muted">Posts</span></span>
        </div>
      </div>

      <div className="border-t border-border">
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="text-center text-text-muted py-8 text-sm">No posts yet</p>
        )}
      </div>
    </div>
  );
}

export function OwnProfile() {
  return <ProfileContent user={currentUser} isOwnProfile />;
}
