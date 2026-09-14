import { getApiBase } from "@/lib/api/base";

/** Resolve media URL — B2 objects served via API proxy */
export function resolveMediaUrl(url?: string | null, objectKey?: string | null): string {
  if (objectKey) {
    return `${getApiBase()}/api/media/${encodeURIComponent(objectKey)}`;
  }
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  return url;
}
