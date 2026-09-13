# Sheytoni — Deploy on cPanel (Production)

معماری نهایی:

| سرویس | دامنه | نوع |
|--------|--------|-----|
| Frontend | https://x.venify.xyz | Static HTML (بدون Node.js) |
| Backend | https://api.venify.xyz | Node.js API |

Frontend فقط UI است و به `https://api.venify.xyz` متصل می‌شود.

---

## ۱. فایل‌های ZIP

| فایل | محتوا |
|------|--------|
| `sheytoni-frontend-production.zip` | سایت استاتیک (`index.html`, `_next/`, ...) |
| `sheytoni-backend-production.zip` | API Node.js (`server.mjs`, `lib/`, `package.json`) |

---

## ۲. Frontend — x.venify.xyz

### Document Root

```
/home/venifybo/x.venify.xyz
```

### مراحل

1. ZIP را Extract کنید **مستقیماً داخل Document Root** (نه داخل پوشهٔ اضافی).
2. بعد از Extract باید این فایل‌ها در Root باشند:
   - `index.html`
   - `_next/` (پوشه)
   - `.htaccess`
   - سایر HTML و assetها
3. در cPanel → **Domains** یا **File Manager** مطمئن شوید دامنه `x.venify.xyz` به این مسیر اشاره می‌کند.
4. **Node.js App برای Frontend لازم نیست.**

### تست

باز کردن https://x.venify.xyz — باید صفحهٔ اصلی Sheytoni نمایش داده شود.

---

## ۳. Backend — api.venify.xyz

### Application Root (پیشنهادی)

```
/home/venifybo/api.venify.xyz
```

### مراحل

1. ZIP را Extract کنید داخل Application Root.
2. ساختار بعد از Extract:

```
api.venify.xyz/
├── server.mjs          ← Startup file (فقط import از lib/server.mjs)
├── package.json
├── .env.example        ← فقط راهنما (مقادیر واقعی در cPanel)
├── lib/                ← تمام کد API
│   ├── server.mjs      ← منطق اصلی (import از ./config.mjs)
│   ├── config.mjs
│   ├── db.mjs
│   └── database/
├── data/               ← SQLite اینجا ساخته می‌شود
└── node_modules/       ← بعد از npm install
```

> **مهم:** `server.mjs` در root فقط entry point است. فایل `config.mjs` داخل `lib/` است — root مستقیماً `./config.mjs` import نمی‌کند.

3. در cPanel → **Setup Node.js App** → **Create Application**

### تنظیمات Node.js App

| فیلد | مقدار |
|------|--------|
| Node.js version | **18** یا **20** (LTS) |
| Application mode | **Production** |
| Application root | `/home/venifybo/api.venify.xyz` |
| Application URL | `api.venify.xyz` |
| Application startup file | `server.mjs` |

### دستورات نصب (مهم — به ترتیب)

**۱.** ZIP را Extract کنید (بدون `node_modules` — ZIP شامل آن نیست).

**۲.** در cPanel → **Setup Node.js App** → Application root را روی `/home/venifybo/api.venify.xyz` تنظیم کنید.

**۳.** نصب dependencies — **یکی از دو روش:**

#### روش A — از cPanel UI (پیشنهادی)

1. cPanel → **Setup Node.js App**
2. اپلیکیشن `api.venify.xyz` را باز کنید
3. روی **Run NPM Install** کلیک کنید
4. **Restart** اپلیکیشن

#### روش B — از SSH / Terminal

> ⚠️ در SSH معمولی `npm: command not found` طبیعی است. ابتدا virtualenv را فعال کنید.

1. cPanel → **Setup Node.js App** → اپلیکیشن را باز کنید
2. دستور **«Enter to virtual environment»** را از بالای صفحه کپی کنید. شکل معمول:

```bash
source /home/venifybo/nodevenv/api.venify.xyz/20/bin/activate && cd /home/venifybo/api.venify.xyz
```

3. در **cPanel Terminal** (نه SSH خام بدون activate) همان دستور را paste کنید
4. بعد از activate، `npm` کار می‌کند:

```bash
rm -rf node_modules package-lock.json
npm install --production
npm rebuild better-sqlite3
```

5. اگر مسیر virtualenv را نمی‌دانید:

```bash
ls ~/nodevenv/
```

**۴.** Environment Variables را تنظیم کنید (پایین).

**۵.** **Stop App** → **Start App** (یا Restart).

> **نکته Passenger:** cPanel/CloudLinux معمولاً `PORT` در env قرار نمی‌دهد. سرور با `listen("passenger")` سازگار است — نیازی به تنظیم دستی PORT نیست.

> **نکته better-sqlite3:** ماژول native است و باید روی سرور با `npm install` ساخته شود. ZIP شامل `node_modules` نیست.

> **نکته CloudLinux:** بعد از `npm install` در virtualenv، cPanel معمولاً `node_modules` را به پوشهٔ اپ symlink می‌کند. اگر `node_modules` خالی است، از **Run NPM Install** در cPanel استفاده کنید.

### Environment Variables (cPanel → Setup Node.js App → Environment Variables)

این متغیرها را در cPanel وارد کنید (مقادیر واقعی را خودتان پر کنید):

| Variable | مقدار / توضیح |
|----------|----------------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `SITE_URL` | `https://x.venify.xyz` |
| `CORS_ORIGINS` | `https://x.venify.xyz` |
| `COOKIE_DOMAIN` | `.venify.xyz` |
| `TELEGRAM_BOT_TOKEN` | توکن ربات Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | رمز تصادفی برای webhook |
| `B2_KEY_ID` | Backblaze B2 Key ID |
| `B2_APPLICATION_KEY` | Backblaze B2 Application Key |
| `B2_BUCKET_NAME` | `Sheytoni` |
| `B2_BUCKET_ID` | شناسه bucket در B2 |
| `DATABASE_PATH` | `data/sheytoni.db` |
| `ADMIN_DEFAULT_USERNAME` | نام کاربری ادمین (اولین اجرا) |
| `ADMIN_DEFAULT_PASSWORD` | رمز ادمین (اولین اجرا) |
| `SERVE_STATIC` | `false` |

> **`PORT` لازم نیست** — Passenger پورت را مدیریت می‌کند. اگر خطای 503 دارید، `npm rebuild better-sqlite3` و Restart کنید.

### عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| `bash: npm: command not found` | virtualenv را فعال کنید (بالا) یا از **Run NPM Install** در cPanel استفاده کنید |
| `Cannot find package 'better-sqlite3'` | بعد از activate virtualenv: `npm install --production` → `npm rebuild better-sqlite3` → Restart |
| `No PORT and not running under Passenger` | ZIP v4 — سرور خودکار `listen("passenger")` استفاده می‌کند |
| 503 بعد از نصب | Restart اپ + بررسی `stderr.log` در cPanel |
| `EACCES` روی `data/` | `chmod 755 data` و مالکیت پوشه را بررسی کنید |

### تست Backend

```
GET https://api.venify.xyz/api/health
```

---

## ۸. سوالات متداول

### Webhook چیست؟ (نیازی به cPanel نیست)

**Webhook مربوط به Telegram Bot است، نه cPanel.**

| مورد | توضیح |
|------|--------|
| چیست؟ | آدرسی که Telegram برای ارسال رویدادهای پرداخت Stars به Backend شما صدا می‌زند |
| کجا تنظیم می‌شود؟ | در Telegram (با API ربات)، **نه** در Setup Node.js App |
| برای Login لازم است؟ | **خیر** — Login از Mini App با `initData` کار می‌کند |
| برای چی لازم است؟ | فقط **پرداخت Premium و Stars** |

بعد از آماده بودن Backend، یک بار در مرورگر باز کنید:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://api.venify.xyz/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

اگر `TELEGRAM_WEBHOOK_SECRET` خالی باشد، webhook هم کار می‌کند (بدون secret).

### چرا در مرورگر عادی Login نمی‌شود؟

Sheytoni عمداً **فقط از داخل Telegram Mini App** Login می‌کند.

| محیط | Login |
|------|-------|
| Telegram Mini App (از ربات) | ✅ خودکار |
| مرورگر Chrome/Safari (سایت مستقیم) | ❌ فقط Guest — باید از ربات باز شود |

کاربر باید از ربات `@Sheytoni_Bot` → **Open App** استفاده کند، نه آدرس `x.venify.xyz` در مرورگر.

اگر در Mini App هم Login نمی‌شود، در Backend این env را بررسی کنید:

```
COOKIE_DOMAIN=.venify.xyz
CORS_ORIGINS=https://x.venify.xyz
```

### پنل ادمین 403 Forbidden

علت معمول: Apache پوشهٔ `admin/` را می‌بیند (بدون `index.html`) و 403 می‌دهد.

**راه‌حل سریع:** `https://x.venify.xyz/admin.html`

**راه‌حل دائم:** Frontend ZIP جدید (با `.htaccess` اصلاح‌شده) را آپلود کنید.

ورود ادمین: username/password از `ADMIN_DEFAULT_USERNAME` و `ADMIN_DEFAULT_PASSWORD` در env Backend.

پاسخ مورد انتظار:

```json
{"ok":true,"dev":false,"b2":true,"bot":true}
```

(`b2` و `bot` بسته به تنظیم credentials شما true یا false می‌شوند.)

---

## ۴. Telegram Webhook

بعد از بالا آمدن Backend:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://api.venify.xyz/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

---

## ۵. دامنه‌ها و CORS

```
x.venify.xyz     →  Frontend (فایل‌های استاتیک)
api.venify.xyz   →  Backend (Node.js)

Frontend  →  fetch به api.venify.xyz (با credentials/cookies)
```

- CORS فقط `https://x.venify.xyz` مجاز است.
- Cookie با `Domain=.venify.xyz` و `SameSite=None; Secure` بین دو ساب‌دامنه کار می‌کند.
- Secretها **فقط** در Environment Variables Backend هستند — نه در Frontend و نه در ZIP.

---

## ۶. SQLite (پایداری داده)

- فایل دیتابیس: `data/sheytoni.db` (مسیر قابل تغییر با `DATABASE_PATH`)
- با Restart سرور از بین نمی‌رود — فقط فایل `data/` را پاک نکنید.
- برای Backup: کپی فایل `data/sheytoni.db`.

---

## ۷. ساخت مجدد ZIP (توسعه‌دهنده)

```bash
bash scripts/build-frontend-production.sh
bash scripts/build-backend-production.sh
```

خروجی در root پروژه:

- `sheytoni-frontend-production.zip`
- `sheytoni-backend-production.zip`
