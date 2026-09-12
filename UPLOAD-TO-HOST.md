# ⚠️ مهم — برای آپلود روی هاست

## از zip سورس GitHub استفاده نکنید

اگر Code → Download ZIP بزنید، **سورس خام** می‌گیرید (بدون سایت آماده، بدون `.env`).

## روش درست

### روش ۱ — پوشه `deploy/` (پیشنهادی)

1. در GitHub بروید به پوشه **`deploy`**
2. همه فایل‌های داخل آن را دانلود/آپلود کنید به `x.venify.xyz`
3. باید **`index.html` مستقیم در روت دامنه** باشد (نه داخل پوشه `out` یا `main`)

### روش ۲ — فایل zip آماده

اگر `sheytoni-deploy.zip` دارید:
1. داخل `x.venify.xyz` استخراج کنید
2. **پوشه اضافی نسازید** — `index.html` باید کنار `backend` باشد

## بعد از آپلود — cPanel Node.js

1. **Setup Node.js App** → Create
2. Application root: `/home/venifybo/x.venify.xyz`
3. Startup file: **`backend/server.mjs`**
4. **Run NPM Install** → **Start**

بدون Node.js فقط لیست فایل می‌بینید — سایت کامل نیست.

راهنمای کامل: `DEPLOY.md`
