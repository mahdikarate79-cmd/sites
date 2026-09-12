export const TELEGRAM_BOT_URL = "https://t.me/Sheytoni_Bot";

export function isTelegramMiniApp(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_FORCE_TMA === "true") return true;
  const tg = (window as Window & { Telegram?: { WebApp?: { initData?: string; platform?: string } } }).Telegram?.WebApp;
  if (!tg) return false;
  return Boolean(tg.initData) || Boolean(tg.platform && tg.platform !== "unknown");
}

export function openTelegramBot(): void {
  window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer");
}
