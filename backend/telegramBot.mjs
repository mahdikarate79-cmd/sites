const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

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
    error_message: errorMessage,
  });
}

export async function setWebhook(url, secret) {
  return botCall("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["pre_checkout_query", "message"],
  });
}

export function verifyWebhookSecret(req, secret) {
  if (!secret) return true;
  return req.headers["x-telegram-bot-api-secret-token"] === secret;
}
