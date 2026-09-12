import crypto from "crypto";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function signPayload(payload, secret) {
  const body = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `${Buffer.from(body).toString("base64url")}.${sig}`;
}

export function verifySignedPayload(token, secret, maxAgeMs = 3600_000) {
  const [bodyB64, sig] = token.split(".");
  if (!bodyB64 || !sig) return null;
  const body = Buffer.from(bodyB64, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(body);
  if (payload.exp && Date.now() > payload.exp) return null;
  if (payload.iat && Date.now() - payload.iat > maxAgeMs) return null;
  return payload;
}
