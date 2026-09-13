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
} from "lucide-react";

type Tab = "dashboard" | "users" | "posts" | "verifications" | "withdrawals" | "notify" | "settings";

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
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (t === "verifications") {
      const r = await adminAction("list_verifications");
      setVerifications((r as { requests: unknown[] }).requests ?? []);
    }
    if (t === "withdrawals") {
      const r = await adminAction("list_withdrawals");
      setWithdrawals((r as { requests: unknown[] }).requests ?? []);
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
    try {
      await adminAction(action, data);
      setMsg("Done");
      await loadTab(tab);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
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

      {msg && <p className="text-center text-sm text-text-muted py-2">{msg}</p>}

      <div className="px-4 pt-4 max-w-3xl mx-auto space-y-4">
        {tab === "dashboard" && stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Users", stats.users],
              ["Active (7d)", stats.activeUsers],
              ["Posters", stats.posters],
              ["Posts", stats.posts],
              ["Media MB", Math.round((stats.mediaBytes ?? 0) / 1024 / 1024)],
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
          <UserActions onAct={act} users={users as Array<{ username: string; id: string; followers: number; verified: boolean; premium: boolean }>} />
        )}

        {tab === "posts" && (
          <PostActions onAct={act} posts={posts as Array<{ id: string; authorId: string; content: string; mediaExpired?: boolean }>} />
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
                    <button type="button" onClick={() => act("approve_verification", { requestId: v.id })} className="px-3 py-1.5 rounded-full bg-[#2AABEE] text-white text-xs">Approve</button>
                    <button type="button" onClick={() => act("reject_verification", { requestId: v.id })} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs">Reject</button>
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
                  <p className="text-xs text-text-muted">{new Date(w.createdAt).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => act("complete_withdrawal", { requestId: w.id })} className="px-3 py-1.5 rounded-full bg-green-600 text-white text-xs">Complete</button>
                    <button type="button" onClick={() => act("reject_withdrawal", { requestId: w.id })} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs">Reject & refund</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "notify" && <NotifyForm onAct={act} />}
        {tab === "settings" && <AdminSettings onAct={act} onCred={adminChangeCredentials} />}
      </div>
    </div>
  );
}

function UserActions({ users, onAct }: { users: Array<{ username: string | null; id: string; telegramId?: number; followers: number; verified: boolean; premium: boolean; displayName?: string }>; onAct: (a: string, d?: Record<string, unknown>) => Promise<void> }) {
  const [target, setTarget] = useState("");
  const [count, setCount] = useState("1000");
  const [stars, setStars] = useState("-100");
  const [found, setFound] = useState<{ user: { id: string; username: string | null; displayName: string; telegramId?: number; followers: number; verified: boolean; premium: boolean }; posts: Array<{ id: string; content?: string }> } | null>(null);
  const [filter, setFilter] = useState("");

  const q = (extra: Record<string, unknown> = {}) => ({ query: target, ...extra });

  const search = async () => {
    try {
      const r = await adminAction("search_user", { query: target }) as { user: typeof found extends null ? never : NonNullable<typeof found>["user"]; posts: Array<{ id: string; content?: string }> };
      setFound({ user: r.user, posts: r.posts ?? [] });
    } catch {
      setFound(null);
    }
  };

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
      <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Username, @name, Telegram ID, or user id" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <button type="button" onClick={search} className="w-full py-2 rounded-full bg-[#2AABEE] text-white text-sm font-medium">Search user</button>

      {found && (
        <div className="glass-nav rounded-xl p-3 space-y-2">
          <p className="font-semibold">{found.user.displayName}</p>
          <p className="text-xs text-text-muted">@{found.user.username ?? "—"} · TG {found.user.telegramId ?? "—"} · {found.user.id}</p>
          <a href={`/profile/${found.user.username || found.user.id}/`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2AABEE] underline">Open profile</a>
          <p className="text-xs text-text-muted">{found.posts.length} posts in DB</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onAct("ban_user", q())} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs">Ban</button>
        <button type="button" onClick={() => onAct("unban_user", q())} className="px-3 py-1.5 rounded-full bg-surface text-xs">Unban</button>
        <button type="button" onClick={() => onAct("set_verified", q({ verified: true }))} className="px-3 py-1.5 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] text-xs">Verify</button>
        <button type="button" onClick={() => onAct("set_verified", q({ verified: false }))} className="px-3 py-1.5 rounded-full bg-surface text-xs">Remove verify</button>
        <button type="button" onClick={() => onAct("set_premium", q({ premium: true, months: 6 }))} className="px-3 py-1.5 rounded-full bg-surface text-xs">Give premium</button>
        <button type="button" onClick={() => onAct("set_premium", q({ premium: false }))} className="px-3 py-1.5 rounded-full bg-surface text-xs">Remove premium</button>
      </div>
      <div className="flex gap-2 items-center">
        <input value={count} onChange={(e) => setCount(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm" />
        <button type="button" onClick={() => onAct("add_fake_followers", q({ count: Number(count) }))} className="px-3 py-1.5 rounded-full bg-surface text-xs">Add fake followers</button>
      </div>
      <div className="flex gap-2 items-center">
        <input value={stars} onChange={(e) => setStars(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm" />
        <button type="button" onClick={() => onAct("adjust_stars", q({ delta: Number(stars) }))} className="px-3 py-1.5 rounded-full bg-surface text-xs">Adjust stars</button>
      </div>
      <button type="button" onClick={() => onAct("unban_all")} className="text-xs text-like">Unban all users</button>

      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter user list…" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.slice(0, 50).map((u) => (
          <button key={u.id} type="button" onClick={() => setTarget(u.username ?? String(u.telegramId ?? u.id))} className="w-full text-left text-xs p-2 rounded-lg hover:bg-surface truncate">
            @{u.username ?? "—"} · TG {u.telegramId ?? "—"} · {u.id}
          </button>
        ))}
      </div>
      <div className="text-xs text-text-muted pt-2">{users.length} registered users</div>
    </div>
  );
}

function PostActions({ posts, onAct }: { posts: Array<{ id: string; authorId: string; content: string; mediaExpired?: boolean }>; onAct: (a: string, d?: Record<string, unknown>) => Promise<void> }) {
  const [postId, setPostId] = useState("");
  const [notify, setNotify] = useState(true);
  const [ban, setBan] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = posts.filter((p) => {
    const f = filter.toLowerCase();
    if (!f) return true;
    return p.id.toLowerCase().includes(f) || (p.content ?? "").toLowerCase().includes(f) || p.authorId.toLowerCase().includes(f);
  });

  return (
    <div className="space-y-3">
      <input value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="Post ID (e.g. p12)" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm font-mono" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify user</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ban} onChange={(e) => setBan(e.target.checked)} /> Ban author</label>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => onAct("delete_post", { postId, notify, banAuthor: ban })} className="px-3 py-1.5 rounded-full bg-like/20 text-like text-xs">Delete post</button>
        <button type="button" onClick={() => onAct("strip_post_media", { postId, notify })} className="px-3 py-1.5 rounded-full bg-surface text-xs">Strip media only</button>
      </div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter posts by ID, author, caption…" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.slice(0, 50).map((p) => (
          <button key={p.id} type="button" onClick={() => setPostId(p.id)} className="w-full text-left text-xs p-2 rounded-lg hover:bg-surface">
            <span className="font-mono text-[#2AABEE]">{p.id}</span>
            <span className="text-text-muted"> · {p.authorId}</span>
            <p className="truncate">{p.content?.slice(0, 80) || "(no caption)"} {p.mediaExpired ? "[media expired]" : ""}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-text-muted">{posts.length} posts in DB · mock feed IDs like p1, p12 work in frontend</p>
    </div>
  );
}

function NotifyForm({ onAct }: { onAct: (a: string, d?: Record<string, unknown>) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("");
  const [broadcast, setBroadcast] = useState(false);

  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={3} className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={broadcast} onChange={(e) => setBroadcast(e.target.checked)} /> Broadcast to all</label>
      {!broadcast && <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm" />}
      <button type="button" onClick={() => onAct("send_notification", { title, body, broadcast, username })} className="w-full py-2.5 rounded-full bg-[#2AABEE] text-white text-sm font-medium">Send</button>
    </div>
  );
}

function AdminSettings({ onAct, onCred }: { onAct: (a: string, d?: Record<string, unknown>) => Promise<void>; onCred: (c: string, u?: string, p?: string) => Promise<unknown> }) {
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
          <button type="button" onClick={() => onAct("set_verification_min_followers", { value: Number(minFollowers) })} className="px-4 py-2 rounded-full bg-[#2AABEE] text-white text-sm">Save</button>
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
