"use client";

import { useEffect } from "react";

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  noindex?: boolean;
}

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function SeoHead({ meta }: { meta: SeoMeta | null }) {
  useEffect(() => {
    if (!meta) return;
    document.title = meta.title;
    upsertMeta("description", meta.description);
    upsertLink("canonical", meta.canonical);
    upsertMeta("robots", meta.noindex ? "noindex,nofollow" : "index,follow");
    upsertMeta("og:title", meta.title, "property");
    upsertMeta("og:description", meta.description, "property");
    upsertMeta("og:url", meta.canonical, "property");
    upsertMeta("og:site_name", "Sheytoni", "property");
    if (meta.image) upsertMeta("og:image", meta.image, "property");
    upsertMeta("twitter:card", meta.image ? "summary_large_image" : "summary");
    upsertMeta("twitter:title", meta.title);
    upsertMeta("twitter:description", meta.description);
    if (meta.image) upsertMeta("twitter:image", meta.image);
    upsertMeta("rating", "adult");
  }, [meta]);

  return null;
}
