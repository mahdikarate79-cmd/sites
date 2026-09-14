import { apiFetch } from "./fetch";
import { SeoMeta } from "@/components/seo/SeoHead";

export async function fetchProfileSeo(slug: string): Promise<SeoMeta | null> {
  try {
    const data = await apiFetch<{ meta: SeoMeta }>(`/api/seo/profile/${encodeURIComponent(slug)}`);
    return data.meta;
  } catch {
    return null;
  }
}

export async function fetchPostSeo(postId: string): Promise<SeoMeta | null> {
  try {
    const data = await apiFetch<{ meta: SeoMeta }>(`/api/seo/post/${encodeURIComponent(postId)}`);
    return data.meta;
  } catch {
    return null;
  }
}
