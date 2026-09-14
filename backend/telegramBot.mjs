const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const SITE_URL = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://x.venify.xyz";

export function isBotConfigured() {
  return !!BOT_TOKEN;
}

async function botCall(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description ?? `Telegram API error ${res.status}`);
  return data.result;
}

/** Create a Telegram Stars invoice link (XTR currency) */
export async function createStarsInvoice({ title, description, payload, amount }) {
  return botCall("createInvoiceLink", {
    title,
    description,
    payload,
    currency: "XTR",
    prices: [{ label: title, amount }],
    provider_token: "",
  });
}

export async function answerPreCheckoutQuery(queryId, ok, errorMessage) {
  return botCall("answerPreCheckoutQuery", {
    pre_checkout_query_id: queryId,
    ok,
    error_message: ok ? undefined : (errorMessage ?? "Payment unavailable"),
  });
}

export async function setWebhook(url, secret) {
  return botCall("setWebhook", {
    url,
    secret_token: secret || undefined,
    allowed_updates: ["pre_checkout_query", "message"],
    drop_pending_updates: false,
  });
}

export async function getWebhookInfo() {
  return botCall("getWebhookInfo", {});
}

export function verifyWebhookSecret(req, secret) {
  if (!secret) return true;
  const header = req.headers["x-telegram-bot-api-secret-token"];
  if (header !== secret) {
    console.warn("[bot] Webhook secret mismatch — set TELEGRAM_WEBHOOK_SECRET in setWebhook secret_token");
    return false;
  }
  return true;
}

export async function sendWelcomeMessage(chatId) {
  const text = [
    "Welcome to Sheytoni (شیطونی)!",
    "",
    "Post freely, connect with others, and earn on our social community platform.",
    "",
    "Tap the button below to open the app and get started.",
  ].join("\n");

  return botCall("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: {
      inline_keyboard: [[{
        text: "Open Sheytoni",
        web_app: { url: SITE_URL },
      }]],
    },
  });
}

export async function ensureWebhookConfigured() {
  if (!isBotConfigured()) return;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL
    ?? (process.env.API_PUBLIC_URL ? `${process.env.API_PUBLIC_URL.replace(/\/$/, "")}/api/telegram/webhook` : null);
  if (!webhookUrl) return;

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  try {
    const info = await getWebhookInfo();
    const current = info?.url ?? "";
    if (current !== webhookUrl || secret) {
      await setWebhook(webhookUrl, secret);
      console.log(`[bot] Webhook set to ${webhookUrl}${secret ? " (secret applied)" : ""}`);
    } else {
      console.log(`[bot] Webhook already at ${current}`);
    }
  } catch (e) {
    console.error("[bot] Webhook setup failed:", e.message);
  }
}
