const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const BANNED_USERNAMES = new Set([
  "admin",
  "sheytoni",
  "support",
  "help",
  "moderator",
  "root",
  "system",
  "official",
  "verified",
  "null",
  "undefined",
]);

export type UsernameValidation =
  | { valid: true }
  | { valid: false; error: string };

export function validateUsername(value: string, currentUsername: string): UsernameValidation {
  const username = value.trim().toLowerCase();
  const current = (currentUsername ?? "").trim().toLowerCase();
  const isOwn = username === current;

  if (!username) {
    return { valid: true };
  }

  if (username.length > 32) {
    return { valid: false, error: "Username must not exceed 32 characters." };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: "This username is invalid." };
  }

  if (!isOwn) {
    if (username.length < 4) {
      return { valid: false, error: "Username must be at least 4 characters." };
    }
    if (BANNED_USERNAMES.has(username)) {
      return { valid: false, error: "This username is not allowed." };
    }
  }

  return { valid: true };
}
