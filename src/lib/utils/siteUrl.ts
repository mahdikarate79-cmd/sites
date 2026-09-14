/** Production site URL for share links and deep links */
export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return "https://x.venify.xyz";
}

export function getPostShareUrl(postId: string): string {
  return `${getSiteUrl()}/post/${postId}/`;
}

/** Opens in Telegram Mini App when bot is configured with this web app URL */
export function getPostTmaUrl(postId: string): string {
  return `${getSiteUrl()}/post/${postId}/`;
}
