export const MIN_STARS_PAYMENT = 5;
export const MAX_STARS_PAYMENT = 25000;

export function clampStars(value) {
  const n = Number(value) || 0;
  return Math.max(MIN_STARS_PAYMENT, Math.min(MAX_STARS_PAYMENT, n));
}

export function isValidPaidStars(value) {
  const n = Number(value) || 0;
  return n >= MIN_STARS_PAYMENT && n <= MAX_STARS_PAYMENT;
}
