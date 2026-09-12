═══════════════════════════════════════════════════
  Sheytoni — همین پوشه را روی هاست آپلود کنید
═══════════════════════════════════════════════════

⚠️  از zip سورس GitHub استفاده نکنید!
    فقط محتویات پوشه «deploy» یا فایل sheytoni-deploy.zip

مراحل:
1) همه فایل‌های این پوشه را داخل x.venify.xyz بریزید
   (index.html باید مستقیم توی روت دامنه باشد)

2) cPanel → Setup Node.js App → Create Application
   - Application root: /home/venifybo/x.venify.xyz
   - Startup file: backend/server.mjs
   - Run NPM Install
   - Start

3) سایت را باز کنید: https://x.venify.xyz

فایل .env از قبل پر شده — نیازی به تنظیم دستی نیست.

دیتابیس: backend/data/sheytoni.db (حذف نکنید)

پنل ادمین: /admin
ورود: adminsheytoni / adminsheytoni
