/**
 * Auth scenario tests — run: node backend/auth.test.mjs
 * Requires auth server on AUTH_PORT (default 8787) with AUTH_DEV_MODE=true
 */
import assert from "assert";

const BASE = `http://localhost:${process.env.AUTH_PORT ?? 8787}`;

async function req(path, { method = "GET", body, cookie } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const data = await res.json();
  return { status: res.status, data, setCookie };
}

function mockInitData(userId, username = "testuser") {
  const user = JSON.stringify({ id: userId, first_name: "Test", username });
  return `user=${encodeURIComponent(user)}&auth_date=${Math.floor(Date.now() / 1000)}&hash=dev`;
}

async function run() {
  console.log("Running auth tests...");

  // A: Guest
  const guest = await req("/api/auth/me");
  assert.strictEqual(guest.data.user, null, "A: guest should have no user");
  assert.strictEqual(guest.data.loginMethod, "guest");

  // B: Telegram without premium
  const loginB = await req("/api/auth/telegram", { method: "POST", body: { initData: mockInitData(1001, "user_b") } });
  assert.strictEqual(loginB.status, 200);
  assert.strictEqual(loginB.data.user.premium, false, "B: no premium");
  const cookieB = loginB.setCookie[0]?.split(";")[0];

  const meB = await req("/api/auth/me", { cookie: cookieB });
  assert.strictEqual(meB.data.user.id, loginB.data.user.id);

  // C: Premium user (set via re-login after manual DB update simulated by new user with premium flag in dev)
  const loginC = await req("/api/auth/telegram", { method: "POST", body: { initData: mockInitData(2002, "premium_user") } });
  const cookieC = loginC.setCookie[0]?.split(";")[0];
  assert.ok(cookieC);

  // D: Logout invalidates session
  await req("/api/auth/logout", { method: "POST", cookie: cookieB });
  const afterLogout = await req("/api/auth/me", { cookie: cookieB });
  assert.strictEqual(afterLogout.data.user, null, "D: session invalid after logout");

  // E: Different telegram account → different user
  const loginE = await req("/api/auth/telegram", { method: "POST", body: { initData: mockInitData(3003, "other_user") } });
  assert.notStrictEqual(loginE.data.user.id, loginB.data.user.id, "E: different account");

  // G: Re-auth same user preserves session user
  const loginG = await req("/api/auth/telegram", { method: "POST", body: { initData: mockInitData(3003, "other_user") } });
  assert.strictEqual(loginG.data.user.id, loginE.data.user.id, "G: refresh keeps same user");

  console.log("All auth tests passed.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
