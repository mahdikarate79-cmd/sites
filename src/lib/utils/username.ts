import { mockUsers } from "@/data/mock/users";

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

const TAKEN_USERNAMES = new Set(
  mockUsers.map((u) => u.username.toLowerCase())
);

export type UsernameValidation =
  | { valid: true }
  | { valid: false; error: string };

export function validateUsername(value: string, currentUsername: string): UsernameValidation {
  const username = value.trim().toLowerCase();
  const isOwn = username === currentUsername.toLowerCase();

  if (!username) {
    return { valid: false, error: "نام کاربری باید حداقل 4 کارکتر داشته باشد." };
  }

  if (username.length > 32) {
    return { valid: false, error: "نام کاربری نباید بیش از 32 کارکتر باشد." };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: "این نام کاربری نامعتبر است." };
  }

  if (!isOwn) {
    if (username.length < 4) {
      return { valid: false, error: "نام کاربری باید حداقل 4 کارکتر داشته باشد." };
    }
    if (TAKEN_USERNAMES.has(username) || BANNED_USERNAMES.has(username)) {
      return { valid: false, error: "این نام کاربری قبلا انتخاب شده." };
    }
  }

  return { valid: true };
}
