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

برای Deploy جداگانه Frontend و Backend، فایل DEPLOY-CPANEL.md را ببینید.
ZIPهای آماده: sheytoni-frontend-production.zip و sheytoni-backend-production.zip

دیتابیس: backend/data/sheytoni.db (حذف نکنید)

پنل ادمین: /admin
ورود: adminsheytoni / adminsheytoni
