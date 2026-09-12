# راهنمای نصب Sheytoni روی هاست (x.venify.xyz)

## خلاصه: چه کار باید بکنید؟

1. فایل **sheytoni-deploy.zip** را دانلود کنید
2. داخل پوشه ساب‌دامین (مثلاً `x.venify.xyz`) استخراج کنید
3. یک دستور اجرا کنید: `./start.sh`

همین. سایت و API با هم بالا می‌آیند.

---

## مرحله‌به‌مرحله (برای کسانی که بلد نیستند)

### مرحله ۱ — دانلود zip

فایل `sheytoni-deploy.zip` را از جایی که بهتان داده شده دانلود کنید (یا با `npm run package` بسازید).

### مرحله ۲ — ورود به File Manager هاست

1. وارد cPanel هاست شوید
2. **File Manager** را باز کنید
3. به پوشه ساب‌دامین بروید، مثلاً:
   - `public_html/x.venify.xyz`
   - یا `domains/x.venify.xyz/public_html`

### مرحله ۳ — آپلود و استخراج

1. فایل zip را **Upload** کنید داخل همان پوشه
2. روی zip راست‌کلیک → **Extract**
3. بعد از استخراج باید این فایل‌ها را ببینید:
   - `start.sh`
   - `.env`
   - `package.json`
   - پوشه `backend`
   - پوشه `out` (سایت آماده)
   - پوشه `public`

### مرحله ۴ — اجرای سایت

#### روش A: Node.js App در cPanel (پیشنهادی)

1. در cPanel بروید به **Setup Node.js App** (یا Software → Node.js)
2. **Create Application**:
   - Node version: 20 یا 22
   - Application root: مسیر پوشه `x.venify.xyz`
   - Application URL: `x.venify.xyz`
   - Application startup file: `backend/server.mjs`
3. **Run NPM Install** را بزنید
4. اپ را **Start** کنید

#### روش B: SSH (اگر دارید)

```bash
cd /path/to/x.venify.xyz
chmod +x start.sh
./start.sh
```

### مرحله ۵ — تست

در مرورگر باز کنید:

- `https://x.venify.xyz` → صفحه اصلی سایت
- `https://x.venify.xyz/admin` → پنل ادمین
- `https://x.venify.xyz/api/health` → باید `{"ok":true}` بدهد

---

## دیتابیس

داده کاربران در فایل زیر ذخیره می‌شود (حذف نکنید):

```
backend/data/sheytoni.db
```

- نوع: **SQLite** (سبک، سریع، مناسب هزاران کاربر)
- با آپدیت کد یا تغییر دامنه، این فایل را **نگه دارید** — داده‌ها پاک نمی‌شوند
- فقط پوشه `backend/data` را backup بگیرید

---

## تغییر دامنه بعداً

فقط در `.env` این خط را عوض کنید:

```
SITE_URL=https://دامنه-جدید.com
CORS_ORIGINS=https://دامنه-جدید.com
```

سپس سرور را restart کنید. دیتابیس و کاربران دست نخورده می‌مانند.

---

## Webhook تلگرام

در BotFather یا با API تلگرام:

```
https://x.venify.xyz/api/telegram/webhook
```

Secret: مقدار `TELEGRAM_WEBHOOK_SECRET` در `.env`

---

## پنل ادمین

آدرس: `/admin`  
ورود پیش‌فرض: `adminsheytoni` / `adminsheytoni`
