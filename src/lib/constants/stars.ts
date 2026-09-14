/** Configurable Stars → USD rate for prototype (e.g. 0.013 USD per Star) */
export const STAR_USD_RATE = 0.013;

export const MIN_STARS_PAYMENT = 5;
export const MAX_PAID_MEDIA_STARS = 25000;

export function starsToUsd(stars: number): number {
  return stars * STAR_USD_RATE;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
