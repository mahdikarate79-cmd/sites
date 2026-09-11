"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MoreVertical, FileText, ImageIcon, Video, Flag, Link2, Info } from "lucide-react";
import { BlockButton } from "@/components/ui/BlockButton";
import { User, Post } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { OrientationBadge } from "@/components/ui/OrientationBadge";
import { FollowButton } from "@/components/ui/FollowButton";
import { PostCard } from "@/components/feed/PostCard";
import { ReportModal } from "@/components/feed/ReportModal";
import { formatCount } from "@/lib/utils/format";
import { getPostsByUser } from "@/lib/api/posts";
import { currentUser } from "@/data/mock/users";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProfileTab = "videos" | "photos" | "posts";

interface ProfileContentProps {
  user: User;
  isOwnProfile?: boolean;
}

export function ProfileContent({ user, isOwnProfile }: ProfileContentProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { isBlocked } = usePrototype();
  const { showToast } = useToast();

  useEffect(() => {
    getPostsByUser(user.id).then(setPosts);
  }, [user.id]);

  const blocked = !isOwnProfile && isBlocked(user.id);

  const filtered = posts.filter((p) => {
    if (tab === "videos") return p.media?.some((m) => m.type === "video" || m.type === "gif");
    if (tab === "photos") return p.media?.some((m) => m.type === "image");
    return !p.media?.length || p.content;
  });

  const tabs: { id: ProfileTab; label: string; icon: typeof FileText }[] = [
    { id: "posts", label: "Posts", icon: FileText },
    { id: "videos", label: "Videos", icon: Video },
    { id: "photos", label: "Photos", icon: ImageIcon },
  ];

  const copyProfileLink = async () => {
    await navigator.clipboard.writeText(`https://sheytoni.app/@${user.username}`);
    showToast("Profile link copied");
    setMenuOpen(false);
  };

  return (
    <div>
      <div className="relative h-36 sm:h-44 bg-surface">
        {user.cover && <Image src={user.cover} alt="Cover" fill className="object-cover" priority sizes="100vw" />}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <Link href="/" className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm mt-1">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm mt-1">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
        {menuOpen && (
          <div className="absolute top-12 right-3 z-20 w-48 bg-surface border border-border rounded-xl py-1 shadow-lg">
            {!isOwnProfile && (
              <>
                <button onClick={() => { setReportOpen(true); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-like"><Flag className="w-4 h-4" /> Report</button>
                <BlockButton userId={user.id} variant="menu" onAction={() => setMenuOpen(false)} />
              </>
            )}
            <button onClick={copyProfileLink} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm"><Link2 className="w-4 h-4" /> Copy profile link</button>
            <button onClick={() => { setAboutOpen(true); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm"><Info className="w-4 h-4" /> About account</button>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <Avatar src={user.avatar} alt={user.displayName} size="xl" className="border-4 border-bg" />
          <div className="flex gap-2">
            {isOwnProfile ? (
              <div className="flex gap-2">
                <Link href="/settings/" className="p-2 rounded-full glass-nav" aria-label="Settings">
                  <Settings className="w-4 h-4" />
                </Link>
                <Link href="/settings/edit-profile/" className="px-4 py-1.5 rounded-full border border-border text-sm font-medium glass-nav">
                  Edit Profile
                </Link>
              </div>
            ) : (
              <>
                <FollowButton userId={user.id} />
                <BlockButton userId={user.id} />
                <Link
                  href={`/chat/c1/`}
                  className={cn(
                    "px-4 py-1.5 rounded-full border border-border text-sm font-medium glass-nav",
                    blocked && "pointer-events-none opacity-40"
                  )}
                  aria-disabled={blocked}
                >
                  Message
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mb-0.5">
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          {user.verified && <VerifiedBadge className="w-5 h-5" />}
          {user.premium && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#6366f1]/30 to-[#8b5cf6]/30 text-[#8b5cf6] font-medium">PRO</span>}
        </div>
        <p className="text-text-muted text-sm mb-1">@{user.username}</p>

        {(user.age || user.orientation) && (
          <div className="flex items-center gap-2 mb-2 text-sm text-text-muted">
            {user.age && <span>{user.age}y</span>}
            {user.orientation && <OrientationBadge orientation={user.orientation} />}
          </div>
        )}

        {user.bio && <p className="text-sm mb-3 leading-relaxed">{user.bio}</p>}

        <div className="flex gap-4 text-sm mb-4">
          <span><strong>{formatCount(user.following)}</strong> <span className="text-text-muted">Following</span></span>
          <span><strong>{formatCount(user.followers)}</strong> <span className="text-text-muted">Followers</span></span>
          <span><strong>{formatCount(user.postsCount)}</strong> <span className="text-text-muted">Posts</span></span>
        </div>
      </div>

      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5",
              tab === id ? "border-text text-text" : "border-transparent text-text-muted"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div>
        {filtered.length > 0 ? (
          filtered.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="text-center text-text-muted py-8 text-sm">No {tab} yet</p>
        )}
      </div>

      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAboutOpen(false)} />
          <div className="relative w-full max-w-md bg-bg rounded-t-2xl sm:rounded-2xl p-5 safe-bottom">
            <h3 className="font-semibold mb-4">About this account</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Joined</span><span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Username changes</span><span>{user.usernameChanges ?? 0}</span></div>
            </div>
            <button onClick={() => setAboutOpen(false)} className="w-full mt-5 py-2.5 rounded-xl bg-surface text-sm font-medium">Close</button>
          </div>
        </div>
      )}

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}

export function OwnProfile() {
  return <ProfileContent user={currentUser} isOwnProfile />;
}
