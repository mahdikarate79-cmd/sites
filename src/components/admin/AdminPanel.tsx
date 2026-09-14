"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminAction,
  adminChangeCredentials,
  adminLogin,
  adminLogout,
  adminMe,
  adminStats,
} from "@/lib/api/admin";
import { formatCount, formatStars } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  BarChart3,
  Users,
  FileText,
  BadgeCheck,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { profilePath } from "@/components/ui/ProfileLink";
import { formatDateTimeEn, formatDateShortEn } from "@/lib/utils/dateFormat";
import { getSiteUrl } from "@/lib/utils/siteUrl";

type Tab = "dashboard" | "users" | "posts" | "media" | "reports" | "verifications" | "withdrawals" | "notify" | "settings";

export function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<unknown[]>([]);
  const [posts, setPosts] = useState<unknown[]>([]);
  const [verifications, setVerifications] = useState<unknown[]>([]);
  const [withdrawals, setWithdrawals] = useState<unknown[]>([]);
  const [reports, setReports] = useState<unknown[]>([]);
  const [chatMedia, setChatMedia] = useState<unknown[]>([]);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      await adminMe();
      setAuthed(true);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const loadStats = async () => {
    setStats(await adminStats());
  };

  const loadTab = async (t: Tab) => {
    setTab(t);
    if (t === "dashboard") await loadStats();
    if (t === "users") {
      const r = await adminAction("list_users");
      setUsers((r as { users: unknown[] }).users ?? []);
    }
    if (t === "posts") {
      const r = await adminAction("list_posts");
      setPosts((r as { posts: unknown[] }).posts ?? []);
    }
    if (t === "media") {
      const r = await adminAction("list_chat_media");
      setChatMedia((r as { media: unknown[] }).media ?? []);
    }
    if (t === "verifications") {
      const r = await adminAction("list_verifications");
      setVerifications((r as { requests: unknown[] }).requests ?? []);
    }
    if (t === "withdrawals") {
      const r = await adminAction("list_withdrawals");
      setWithdrawals((r as { requests: unknown[] }).requests ?? []);
    }
    if (t === "reports") {
      const r = await adminAction("list_reports");
      setReports((r as { reports: unknown[] }).reports ?? []);
    }
  };

  useEffect(() => {
    if (authed) loadTab(tab);
  }, [authed]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(username, password);
      setAuthed(true);
      setMsg("");
      await loadTab("dashboard");
    } catch {
      setMsg("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const act = async (action: string, data: Record<string, unknown> = {}) => {
    const key = `${action}:${JSON.stringify(data)}`;
    setPendingAction(key);
    setMsg("");
    try {
      const result = await adminAction(action, data) as Record<string, unknown>;
      setMsgOk(true);
      if (action === "add_fake_followers" && result.displayFollowers != null) {
        setMsg(`Followers updated → ${result.displayFollowers}`);
      } else if (action === "add_fake_likes" && result.displayLikes != null) {
        setMsg(`Likes updated → ${result.displayLikes}`);
      } else if (action === "adjust_stars" && result.earnings != null) {
        setMsg(`Creator earnings → ${result.earnings}`);
      } else if (action === "send_notification") {
        setMsg("Notification sent");
      } else {
        setMsg("Applied");
      }
      await loadTab(tab);
      return result;
    } catch (e) {
      setMsgOk(false);
      setMsg(e instanceof Error ? e.message : "Error");
      return null;
    } finally {
      setPendingAction(null);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm glass-nav rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Shield className="w-6 h-6 text-[#2AABEE]" />
            <h1 className="text-lg font-bold">Sheytoni Admin</h1>
          </div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm"
            autoComplete="current-password"
          />
          {msg && <p className="text-like text-sm text-center">{msg}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-[#2AABEE] text-white font-semibold text-sm">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "dashboard", label: "Stats", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "media", label: "Media", icon: FileText },
    { id: "reports", label: "Reports", icon: AlertTriangle },
    { id: "verifications", label: "Verify", icon: BadgeCheck },
    { id: "withdrawals", label: "Withdraw", icon: Wallet },
    { id: "notify", label: "Notify", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <header className="sticky top-0 z-30 bg-bg/95 border-b border-border px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-[#2AABEE]" /> Admin</h1>
        <button type="button" onClick={async () => { await adminLogout(); setAuthed(false); }} className="p-2 text-text-muted hover:text-text">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <nav className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => loadTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0",
              tab === id ? "bg-[#2AABEE] text-white" : "bg-surface text-text-muted"
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </nav>

      {msg && (
        <p className={cn(
          "text-center text-sm py-2 flex items-center justify-center gap-1.5",
          msgOk ? "text-emerald-500" : "text-like"
        )}>
          {msgOk && <CheckCircle2 className="w-4 h-4" />}
          {msg}
        </p>
      )}

      <div className="px-4 pt-4 max-w-3xl mx-auto space-y-4">
        {tab === "dashboard" && stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Users", stats.users],
              ["Active (7d)", stats.activeUsers],
              ["Posters", stats.posters],
              ["Posts", stats.posts],
              ["Media MB", Math.round((stats.mediaBytes ?? 0) / 1024 / 1024)],
              ["B2 objects", stats.b2Objects ?? 0],
              ["Local media", stats.localObjects ?? 0],
              ["B2 connected", stats.b2Configured ? "yes" : "no"],
              ["Banned", stats.banned],
              ["Pending verify", stats.pendingVerifications],
              ["Pending withdraw", stats.pendingWithdrawals],
            ].map(([label, val]) => (
              <div key={String(label)} className="glass-nav rounded-xl p-3">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-xl font-bold">{formatCount(Number(val))}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <UserActions
            onAct={act}
            pendingAction={pendingAction}
            users={users as Array<{ username: string | null; id: string; telegramId?: number; followers: number; verified: boolean; premium: boolean; displayName?: string }>}
          />
        )}

        {tab === "posts" && (
          <PostActions onAct={act} pendingAction={pendingAction} posts={posts as Array<{ id: string; authorId: string; content: string; createdAt?: string; media?: Array<{ type: string; url?: string | null; thumbnail?: string | null }>; mediaBytes?: number; mediaExpired?: boolean; likes?: number; fakeLikes?: number; views?: number; fakeViews?: number; displayLikes?: number; displayViews?: number; authorUsername?: string | null; authorDisplayName?: string | null }>} />
        )}

        {tab === "media" && (
          <ChatMediaActions onAct={act} pendingAction={pendingAction} media={chatMedia as Array<{ chatId: string; messageId: string; objectKey: string; type: string; size: number; url?: string | null; createdAt: string; senderId: string; expired?: boolean }>} />
        )}

        {tab === "reports" && (
          <ReportActions onAct={act} pendingAction={pendingAction} reports={reports as Array<{ id: string; reporterId?: string; reporterUsername?: string | null; reporterDisplayName?: string | null; postId?: string | null; userId?: string | null; category: string; subcategory?: string; detail?: string; postContent?: string | null; postMedia?: Array<{ type: string; url?: string | null; thumbnail?: string | null }>; reportedUsername?: string | null; reportedUser?: { id: string; displayName: string; username?: string | null; avatar?: string } | null; createdAt: string; status: string; postCreatedAt?: string | null; postLikes?: number; postViews?: number; postShares?: number; postAuthor?: { id: string; displayName: string; username?: string | null; avatar?: string } | null }>} />
        )}

        {tab === "verifications" && (
          <div className="space-y-2">
            {(verifications as Array<{ id: string; username: string; displayName: string; followers: number; status: string }>)
              .filter((v) => v.status === "pending")
              .map((v) => (
                <div key={v.id} className="glass-nav rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">@{v.username}</p>
                    <p className="text-xs text-text-muted">{v.displayName} · {formatCount(v.followers)} followers</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      label="Approve"
                      pending={pendingAction === `approve_verification:${JSON.stringify({ requestId: v.id })}`}
                      onClick={() => act("approve_verification", { requestId: v.id })}
                      className="px-3 py-1.5 rounded-full bg-[#2AABEE] text-white text-xs"
                    />
                    <ActionButton
                      label="Reject"
                      pending={pendingAction === `reject_verification:${JSON.stringify({ requestId: v.id })}`}
                      onClick={() => act("reject_verification", { requestId: v.id })}
                      className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "withdrawals" && (
          <div className="space-y-2">
            {(withdrawals as Array<{ id: string; username: string; stars: number; usd: string; wallet: string; createdAt: string; status: string }>)
              .filter((w) => w.status === "pending")
              .map((w) => (
                <div key={w.id} className="glass-nav rounded-xl p-3 space-y-2">
                  <p className="font-medium">@{w.username} — {formatStars(w.stars)} ({w.usd} USD)</p>
                  <p className="text-xs text-text-muted break-all">Wallet: {w.wallet}</p>
                  <p className="text-xs text-text-muted">{formatDateTimeEn(w.createdAt)}</p>
                  <div className="flex gap-2">
                    <ActionButton
                      label="Complete"
                      pending={pendingAction === `complete_withdrawal:${JSON.stringify({ requestId: w.id })}`}
                      onClick={() => act("complete_withdrawal", { requestId: w.id })}
                      className="px-3 py-1.5 rounded-full bg-green-600 text-white text-xs"
                    />
                    <ActionButton
                      label="Reject & refund"
                      pending={pendingAction === `reject_withdrawal:${JSON.stringify({ requestId: w.id })}`}
                      onClick={() => act("reject_withdrawal", { requestId: w.id })}
                      className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "notify" && <NotifyForm onAct={act} pendingAction={pendingAction} />}
        {tab === "settings" && <AdminSettings onAct={act} pendingAction={pendingAction} onCred={adminChangeCredentials} />}
      </div>
    </div>
  );
}

function ActionButton({ label, pending, onClick, className }: { label: string; pending?: boolean; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={pending} className={cn(className, "inline-flex items-center gap-1.5 disabled:opacity-60 transition-opacity")}>
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {label}
    </button>
  );
}

function UserActions({ users, onAct, pendingAction }: { users: Array<{ username: string | null; id: string; telegramId?: number; followers: number; verified: boolean; premium: boolean; displayName?: string }>; onAct: (a: string, d?: Record<string, unknown>) => Promise<Record<string, unknown> | null>; pendingAction: string | null }) {
  const [target, setTarget] = useState("");
  const [count, setCount] = useState("1000");
  const [stars, setStars] = useState("-100");
  const [found, setFound] = useState<{ user: { id: string; username: string | null; displayName: string; telegramId?: number; followers: number; verified: boolean; premium: boolean }; posts: Array<{ id: string; content?: string }> } | null>(null);
  const [filter, setFilter] = useState("");

  const q = (extra: Record<string, unknown> = {}) => ({ query: target, ...extra });

  const search = async () => {
    try {
      const r = await adminAction("search_user", { query: target }) as { user: NonNullable<typeof found>["user"]; posts: Array<{ id: string; content?: string }> };
      setFound({ user: r.user, posts: r.posts ?? [] });
    } catch {
      setFound(null);
    }
  };

  const runAction = async (action: string, extra: Record<string, unknown> = {}) => {
    const result = await onAct(action, q(extra));
    if (result?.user && found) {
      setFound({ ...found, user: result.user as typeof found.user });
    }
  };

  const isPending = (action: string, extra: Record<string, unknown> = {}) =>
    pendingAction === `${action}:${JSON.stringify(q(extra))}`;

  const filtered = users.filter((u) => {
    const f = filter.toLowerCase();
    if (!f) return true;
    return (
      (u.username ?? "").toLowerCase().includes(f)
      || u.id.toLowerCase().includes(f)
      || String(u.telegramId ?? "").includes(f)
      || (u.displayName ?? "").toLowerCase().includes(f)
    );
  });

  return (
    <div className="space-y-3">
      <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Site @username or Telegram ID" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <button type="button" onClick={search} className="w-full py-2 rounded-full bg-[#2AABEE] text-white text-sm font-medium">Search user</button>

      {found && (
        <div className="glass-nav rounded-xl p-3 space-y-2">
          <p className="font-semibold">{found.user.displayName}</p>
          <p className="text-xs text-text-muted">@{found.user.username ?? "—"} · TG {found.user.telegramId ?? "—"} · {found.user.id}</p>
          <a href={profilePath({ id: found.user.id, username: found.user.username ?? undefined })} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2AABEE] underline">Open profile</a>
          <p className="text-xs text-text-muted">{found.posts.length} posts in DB</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionButton label="Ban" pending={isPending("ban_user")} onClick={() => runAction("ban_user")} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs" />
        <ActionButton label="Unban" pending={isPending("unban_user")} onClick={() => runAction("unban_user")} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
        <ActionButton label="Verify" pending={isPending("set_verified", { verified: true })} onClick={() => runAction("set_verified", { verified: true })} className="px-3 py-1.5 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] text-xs" />
        <ActionButton label="Remove verify" pending={isPending("set_verified", { verified: false })} onClick={() => runAction("set_verified", { verified: false })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
        <ActionButton label="Premium 1m" pending={isPending("set_premium", { premium: true, months: 1 })} onClick={() => runAction("set_premium", { premium: true, months: 1 })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
        <ActionButton label="Premium 6m" pending={isPending("set_premium", { premium: true, months: 6 })} onClick={() => runAction("set_premium", { premium: true, months: 6 })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
        <ActionButton label="Premium 1y" pending={isPending("set_premium", { premium: true, months: 12 })} onClick={() => runAction("set_premium", { premium: true, months: 12 })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
        <ActionButton label="Premium lifetime" pending={isPending("set_premium", { premium: true, lifetime: true })} onClick={() => runAction("set_premium", { premium: true, lifetime: true })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
        <ActionButton label="Remove premium" pending={isPending("set_premium", { premium: false })} onClick={() => runAction("set_premium", { premium: false })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input value={count} onChange={(e) => setCount(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm" />
        <ActionButton label="Adjust followers (+/-)" pending={isPending("add_fake_followers", { count: Number(count) })} onClick={() => runAction("add_fake_followers", { count: Number(count) })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
      </div>
      <div className="flex gap-2 items-center">
        <input value={stars} onChange={(e) => setStars(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm" />
        <ActionButton label="Adjust creator earnings" pending={isPending("adjust_stars", { delta: Number(stars) })} onClick={() => runAction("adjust_stars", { delta: Number(stars) })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
      </div>
      <button type="button" onClick={() => onAct("unban_all")} className="text-xs text-like">Unban all users</button>

      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter user list…" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.slice(0, 50).map((u) => (
          <button key={u.id} type="button" onClick={() => setTarget(u.username ? `@${u.username}` : String(u.telegramId ?? u.id))} className="w-full text-left text-xs p-2 rounded-lg hover:bg-surface truncate">
            {u.username ? `@${u.username}` : "(no username)"} · TG {u.telegramId ?? "—"}
          </button>
        ))}
      </div>
      <div className="text-xs text-text-muted pt-2">{users.length} registered users</div>
    </div>
  );
}

function AdminMediaPreview({ media }: { media?: { type: string; url?: string | null; thumbnail?: string | null } }) {
  if (!media?.url) return null;
  const src = media.type === "video" ? (media.thumbnail ?? media.url) : media.url;
  return <img src={src} alt="" className="rounded-lg max-h-40 w-full object-cover" />;
}

type PostSort = "newest" | "oldest" | "size_desc";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function PostActions({ posts, onAct, pendingAction }: { posts: Array<{ id: string; authorId: string; content: string; createdAt?: string; media?: Array<{ type: string; url?: string | null; thumbnail?: string | null }>; mediaBytes?: number; mediaExpired?: boolean; likes?: number; fakeLikes?: number; views?: number; fakeViews?: number; displayLikes?: number; displayViews?: number; authorUsername?: string | null; authorDisplayName?: string | null }>; onAct: (a: string, d?: Record<string, unknown>) => Promise<Record<string, unknown> | null>; pendingAction: string | null }) {
  const [postId, setPostId] = useState("");
  const [likeCount, setLikeCount] = useState("100");
  const [viewCount, setViewCount] = useState("100");
  const [notify, setNotify] = useState(true);
  const [ban, setBan] = useState(false);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<PostSort>("newest");
  const selected = posts.find((p) => p.id === postId);

  const filtered = posts.filter((p) => {
    const f = filter.toLowerCase();
    if (!f) return true;
    return p.id.toLowerCase().includes(f) || (p.content ?? "").toLowerCase().includes(f) || p.authorId.toLowerCase().includes(f);
  }).sort((a, b) => {
    if (sort === "size_desc") return (b.mediaBytes ?? 0) - (a.mediaBytes ?? 0);
    if (sort === "oldest") return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  return (
    <div className="space-y-3">
      <input value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="Post ID (e.g. p12)" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm font-mono" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify user</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ban} onChange={(e) => setBan(e.target.checked)} /> Ban author</label>
      <div className="flex gap-2 flex-wrap">
        <ActionButton label="Delete post" pending={pendingAction === `delete_post:${JSON.stringify({ postId, notify, banAuthor: ban })}`} onClick={() => onAct("delete_post", { postId, notify, banAuthor: ban })} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs" />
        <ActionButton label="Strip media only" pending={pendingAction === `strip_post_media:${JSON.stringify({ postId, notify })}`} onClick={() => onAct("strip_post_media", { postId, notify })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
      </div>
      {selected && (
        <div className="glass-nav rounded-xl p-3 space-y-2 text-xs">
          <p className="font-semibold">{selected.authorDisplayName ?? selected.authorId} @{selected.authorUsername ?? "—"}</p>
          <p className="text-text-muted whitespace-pre-wrap">{selected.content?.slice(0, 300) || "(no caption)"}</p>
          {selected.media?.[0]?.url && !selected.mediaExpired && (
            <AdminMediaPreview media={selected.media[0]} />
          )}
          <p className="text-text-muted">
            Likes {selected.displayLikes ?? ((selected.likes ?? 0) + (selected.fakeLikes ?? 0))} · Views {selected.displayViews ?? ((selected.views ?? 0) + (selected.fakeViews ?? 0))}
          </p>
        </div>
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <input value={likeCount} onChange={(e) => setLikeCount(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm" placeholder="+/- likes" />
        <ActionButton label="Adjust likes (+/-)" pending={pendingAction === `add_fake_likes:${JSON.stringify({ postId, count: Number(likeCount) })}`} onClick={() => onAct("add_fake_likes", { postId, count: Number(likeCount) })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input value={viewCount} onChange={(e) => setViewCount(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm" placeholder="+/- views" />
        <ActionButton label="Adjust views (+/-)" pending={pendingAction === `adjust_post_stats:${JSON.stringify({ postId, fakeViewsDelta: Number(viewCount) })}`} onClick={() => onAct("adjust_post_stats", { postId, fakeViewsDelta: Number(viewCount) })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["newest", "oldest", "size_desc"] as PostSort[]).map((s) => (
          <button key={s} type="button" onClick={() => setSort(s)} className={cn("px-3 py-1.5 rounded-full text-xs", sort === s ? "bg-[#2AABEE] text-white" : "bg-surface")}>
            {s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "Largest"}
          </button>
        ))}
      </div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter posts by ID, author, caption…" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.slice(0, 50).map((p) => (
          <button key={p.id} type="button" onClick={() => setPostId(p.id)} className="w-full text-left text-xs p-2 rounded-lg hover:bg-surface">
            <span className="font-mono text-[#2AABEE]">{p.id}</span>
            <span className="text-text-muted"> · @{p.authorUsername ?? p.authorId}</span>
            <p className="truncate">{p.content?.slice(0, 80) || "(no caption)"} {p.mediaExpired ? "[media expired]" : p.media?.length ? `[media ${formatBytes(p.mediaBytes ?? 0)}]` : ""}</p>
            <p className="text-text-muted">♥ {p.displayLikes ?? ((p.likes ?? 0) + (p.fakeLikes ?? 0))} · 👁 {p.displayViews ?? ((p.views ?? 0) + (p.fakeViews ?? 0))}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-text-muted">{posts.length} posts in DB</p>
    </div>
  );
}

type MediaSort = "newest" | "oldest" | "size_desc";

function ChatMediaActions({ media, onAct, pendingAction }: { media: Array<{ chatId: string; messageId: string; objectKey: string; type: string; size: number; url?: string | null; createdAt: string; senderId: string; expired?: boolean }>; onAct: (a: string, d?: Record<string, unknown>) => Promise<Record<string, unknown> | null>; pendingAction: string | null }) {
  const [sort, setSort] = useState<MediaSort>("size_desc");
  const [filter, setFilter] = useState("");

  const sorted = media
    .filter((m) => {
      const f = filter.toLowerCase();
      if (!f) return true;
      return m.chatId.toLowerCase().includes(f) || m.objectKey.toLowerCase().includes(f) || m.senderId.toLowerCase().includes(f);
    })
    .sort((a, b) => {
      if (sort === "size_desc") return (b.size ?? 0) - (a.size ?? 0);
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">{media.length} chat media objects</p>
      <div className="flex gap-2 flex-wrap">
        {(["newest", "oldest", "size_desc"] as MediaSort[]).map((s) => (
          <button key={s} type="button" onClick={() => setSort(s)} className={cn("px-3 py-1.5 rounded-full text-xs", sort === s ? "bg-[#2AABEE] text-white" : "bg-surface")}>
            {s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "Largest"}
          </button>
        ))}
      </div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by chat, object key, sender…" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <div className="space-y-2 max-h-[70dvh] overflow-y-auto">
        {sorted.slice(0, 80).map((m) => (
          <div key={`${m.chatId}:${m.objectKey}`} className="glass-nav rounded-xl p-3 flex gap-3">
            {m.url && !m.expired ? (
              <img src={m.url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-surface" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-surface shrink-0 flex items-center justify-center text-[10px] text-text-muted">gone</div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-mono truncate">{m.objectKey}</p>
              <p className="text-[11px] text-text-muted">{m.type} · {formatBytes(m.size)} · {formatDateTimeEn(m.createdAt)}</p>
              <p className="text-[11px] text-text-muted truncate">Chat {m.chatId} · Msg {m.messageId}</p>
              {!m.expired && (
                <ActionButton
                  label="Strip"
                  pending={pendingAction === `strip_chat_media:${JSON.stringify({ chatId: m.chatId, messageId: m.messageId, objectKey: m.objectKey })}`}
                  onClick={() => onAct("strip_chat_media", { chatId: m.chatId, messageId: m.messageId, objectKey: m.objectKey })}
                  className="px-3 py-1 rounded-full bg-like/20 text-like text-xs"
                />
              )}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-text-muted text-center py-8">No chat media</p>}
      </div>
    </div>
  );
}

type AdminReport = {
  id: string;
  reporterId?: string;
  reporterUsername?: string | null;
  reporterDisplayName?: string | null;
  postId?: string | null;
  userId?: string | null;
  category: string;
  subcategory?: string;
  detail?: string;
  postContent?: string | null;
  postMedia?: Array<{ type: string; url?: string | null; thumbnail?: string | null }>;
  reportedUsername?: string | null;
  reportedUser?: { id: string; displayName: string; username?: string | null; avatar?: string } | null;
  createdAt: string;
  status: string;
  postCreatedAt?: string | null;
  postLikes?: number;
  postViews?: number;
  postShares?: number;
  postAuthor?: { id: string; displayName: string; username?: string | null; avatar?: string } | null;
};

function ReportActions({ reports, onAct, pendingAction }: { reports: AdminReport[]; onAct: (a: string, d?: Record<string, unknown>) => Promise<Record<string, unknown> | null>; pendingAction: string | null }) {
  const pending = reports.filter((r) => String(r.status).toLowerCase() === "pending");

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">{pending.length} pending reports</p>
      {pending.length === 0 && <p className="text-sm text-text-muted text-center py-8">No pending reports</p>}
      {pending.map((r) => {
        const postUrl = r.postId ? `${getSiteUrl()}/post/${r.postId}/` : null;
        const targetUser = r.postAuthor ?? r.reportedUser;
        const targetUserId = r.postAuthor?.id ?? r.userId ?? null;
        const targetUsername = r.postAuthor?.username ?? r.reportedUsername ?? r.reportedUser?.username ?? null;
        return (
          <div key={r.id} className="glass-nav rounded-xl p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{r.category}{r.subcategory ? ` · ${r.subcategory}` : ""}</p>
                <p className="text-xs text-text-muted">Reported {formatDateTimeEn(r.createdAt)}</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  By {r.reporterDisplayName ?? "Unknown"}{r.reporterUsername ? ` @${r.reporterUsername}` : ""}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-amber-400">{r.status}</span>
            </div>

            {targetUser && (
              <div className="flex items-center gap-2 text-xs rounded-lg bg-surface/50 p-2">
                {targetUser.avatar && <img src={targetUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />}
                <div>
                  <p className="text-[10px] text-text-muted uppercase">{r.postId ? "Post author" : "Reported user"}</p>
                  <p className="font-semibold">{targetUser.displayName}</p>
                  <p className="text-text-muted">@{targetUsername ?? "—"}</p>
                </div>
              </div>
            )}

            {r.postId ? (
              <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted">
                <span>Post ID: <span className="font-mono text-text">{r.postId}</span></span>
                <span>Published: {formatDateShortEn(r.postCreatedAt)}</span>
                <span>Likes: {r.postLikes ?? 0}</span>
                <span>Views: {r.postViews ?? 0}</span>
                <span>Shares: {r.postShares ?? 0}</span>
                {postUrl && (
                  <a href={postUrl} target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] underline col-span-2">
                    Open post
                  </a>
                )}
              </div>
            ) : r.userId ? (
              <p className="text-[11px] text-text-muted">User report · ID <span className="font-mono text-text">{r.userId}</span></p>
            ) : null}

            {r.postContent ? (
              <p className="text-xs whitespace-pre-wrap bg-surface/40 rounded-lg p-2">{r.postContent.slice(0, 500)}</p>
            ) : (
              <p className="text-xs text-text-muted italic">No post caption stored</p>
            )}
            {r.detail && <p className="text-xs text-text-muted italic">Reporter note: {r.detail}</p>}
            {r.postMedia?.[0]?.url && <AdminMediaPreview media={r.postMedia[0]} />}

            <div className="flex flex-wrap gap-2 pt-1">
              {r.postId && (
                <>
                  <ActionButton label="Delete post" pending={pendingAction === `delete_post:${JSON.stringify({ postId: r.postId, notify: true, banAuthor: false })}`} onClick={() => onAct("delete_post", { postId: r.postId, notify: true })} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs" />
                  <ActionButton label="Strip media" pending={pendingAction === `strip_post_media:${JSON.stringify({ postId: r.postId, notify: true })}`} onClick={() => onAct("strip_post_media", { postId: r.postId, notify: true })} className="px-3 py-1.5 rounded-full bg-surface text-xs" />
                </>
              )}
              {targetUserId && (
                <ActionButton
                  label="Ban user"
                  pending={pendingAction === `ban_user:${JSON.stringify({ query: targetUsername ? `@${targetUsername}` : targetUserId })}`}
                  onClick={() => onAct("ban_user", { query: targetUsername ? `@${targetUsername}` : targetUserId })}
                  className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs"
                />
              )}
              <ActionButton label="Mark reviewed" pending={pendingAction === `mark_report_reviewed:${JSON.stringify({ reportId: r.id })}`} onClick={() => onAct("mark_report_reviewed", { reportId: r.id })} className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotifyForm({ onAct, pendingAction }: { onAct: (a: string, d?: Record<string, unknown>) => Promise<Record<string, unknown> | null>; pendingAction: string | null }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("");
  const [broadcast, setBroadcast] = useState(false);

  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={3} className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={broadcast} onChange={(e) => setBroadcast(e.target.checked)} /> Broadcast to all</label>
      {!broadcast && <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Site @username or Telegram ID" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />}
      <ActionButton
        label="Send"
        pending={!!pendingAction?.startsWith("send_notification:")}
        onClick={() => onAct("send_notification", { title, body, broadcast, query: username, username })}
        className="w-full py-2.5 rounded-full bg-[#2AABEE] text-white text-sm font-medium justify-center"
      />
    </div>
  );
}

function AdminSettings({ onAct, pendingAction, onCred }: { onAct: (a: string, d?: Record<string, unknown>) => Promise<Record<string, unknown> | null>; pendingAction: string | null; onCred: (c: string, u?: string, p?: string) => Promise<unknown> }) {
  const [minFollowers, setMinFollowers] = useState("10000");
  const [curPass, setCurPass] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Min followers for verification</label>
        <div className="flex gap-2 mt-1">
          <input value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
          <ActionButton label="Save" pending={pendingAction === `set_verification_min_followers:${JSON.stringify({ value: Number(minFollowers) })}`} onClick={() => onAct("set_verification_min_followers", { value: Number(minFollowers) })} className="px-4 py-2 rounded-full bg-[#2AABEE] text-white text-sm" />
        </div>
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-sm font-medium">Change admin credentials</p>
        <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="Current password" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
        <input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="New username (optional)" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password (optional)" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
        <button type="button" onClick={() => onCred(curPass, newUser || undefined, newPass || undefined)} className="w-full py-2.5 rounded-full bg-surface text-sm font-medium">Update credentials</button>
      </div>
    </div>
  );
}
