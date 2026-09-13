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
├── server.mjs          ← Startup file
├── package.json
├── .env.example        ← فقط راهنما (مقادیر واقعی در cPanel)
├── lib/                ← کد API
│   ├── config.mjs
│   ├── db.mjs
│   └── database/
└── data/               ← SQLite اینجا ساخته می‌شود
```

3. در cPanel → **Setup Node.js App** → **Create Application**

### تنظیمات Node.js App

| فیلد | مقدار |
|------|--------|
| Node.js version | **18** یا **20** (LTS) |
| Application mode | **Production** |
| Application root | `/home/venifybo/api.venify.xyz` |
| Application URL | `api.venify.xyz` |
| Application startup file | `server.mjs` |

### دستورات

در ترمینال cPanel (یا از دکمه Run NPM Install):

```bash
cd /home/venifybo/api.venify.xyz
npm install --production
```

سپس **Restart** اپلیکیشن Node.js.

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

> `PORT` را cPanel خودش تنظیم می‌کند — معمولاً نیازی به دستی وارد کردن نیست.

### تست Backend

```
GET https://api.venify.xyz/api/health
```

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
