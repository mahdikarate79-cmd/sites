import { findUserById, publicUser } from "./db.mjs";
import { getPostById, resolveProfileUser } from "./social.mjs";
import { config } from "./config.mjs";

const SITE_URL = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://x.venify.xyz").replace(/\/$/, "");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPostPublic(post) {
  if (!post) return false;
  const p = post.privacy;
  if (!p?.enabled) return true;
  return false;
}

function profileUrl(user) {
  const slug = user.username ?? user.id;
  return `${SITE_URL}/profile/${encodeURIComponent(slug)}/`;
}

function postUrl(postId) {
  return `${SITE_URL}/post/${encodeURIComponent(postId)}/`;
}

function mediaUrl(m) {
  if (!m) return null;
  if (m.objectKey) return `${config.apiUrl}/api/media/${encodeURIComponent(m.objectKey)}`;
  const u = String(m.url ?? "");
  if (u.startsWith("http")) return u;
  return null;
}

export function listIndexableUrls(db) {
  const urls = [{ loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" }];
  for (const user of Object.values(db.users ?? {})) {
    if (user.deleted || user.banned) continue;
    const pub = publicUser(user);
    if (!pub?.username && !pub?.id) continue;
    urls.push({
      loc: profileUrl(pub),
      lastmod: user.lastActiveAt ?? user.createdAt,
      changefreq: "weekly",
      priority: "0.7",
    });
  }
  for (const post of Object.values(db.posts ?? {})) {
    if (!isPostPublic(post)) continue;
    const author = findUserById(db, post.authorId);
    if (!author || author.deleted || author.banned) continue;
    urls.push({
      loc: postUrl(post.id),
      lastmod: post.updatedAt ?? post.createdAt,
      changefreq: "weekly",
      priority: "0.6",
    });
  }
  return urls;
}

export function renderSitemapXml(db) {
  const urls = listIndexableUrls(db);
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : "";
    return `  <url><loc>${esc(u.loc)}</loc>${lastmod}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}

export function renderRobotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /chat",
    "Disallow: /settings",
    "Disallow: /api/",
    `Sitemap: ${config.apiUrl}/sitemap.xml`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

export function renderProfileHtml(db, usernameOrId) {
  const user = resolveProfileUser(db, usernameOrId);
  if (!user || user.deleted || user.banned) return null;
  const pub = publicUser(user);
  const url = profileUrl(pub);
  const title = `${pub.displayName}${pub.username ? ` (@${pub.username})` : ""} on Sheytoni | شیطونی`;
  const desc = pub.bio?.trim() || `${pub.displayName} on Sheytoni — social community platform.`;
  const image = pub.avatar || `${SITE_URL}/logo.png`;
  const stats = `${pub.postsCount ?? 0} posts · ${pub.followers ?? 0} followers`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: title,
    url,
    mainEntity: {
      "@type": "Person",
      name: pub.displayName,
      alternateName: pub.username ? `@${pub.username}` : undefined,
      description: desc,
      image,
      url,
      interactionStatistic: [
        { "@type": "InteractionCounter", interactionType: "https://schema.org/FollowAction", userInteractionCount: pub.followers ?? 0 },
      ],
    },
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="${esc(url)}"/>
  <meta property="og:type" content="profile"/>
  <meta property="og:site_name" content="Sheytoni"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:url" content="${esc(url)}"/>
  <meta property="og:image" content="${esc(image)}"/>
  <meta name="twitter:card" content="summary"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(desc)}"/>
  <meta name="twitter:image" content="${esc(image)}"/>
  <meta name="rating" content="adult"/>
  ${jsonLdScript(schema)}
  <meta http-equiv="refresh" content="0;url=${esc(url)}"/>
</head>
<body>
  <main>
    <h1>${esc(pub.displayName)}</h1>
    <p>${esc(desc)}</p>
    <p>${esc(stats)}</p>
    <p><a href="${esc(url)}">View profile on Sheytoni</a></p>
  </main>
</body>
</html>`;
}

export function renderPostHtml(db, postId, viewerId = null) {
  const post = getPostById(db, postId, viewerId);
  if (!post || !isPostPublic(post)) return null;
  const author = post.author;
  const url = postUrl(post.id);
  const excerpt = (post.content ?? "").trim().slice(0, 160) || "Post on Sheytoni";
  const title = `${excerpt.slice(0, 60)} — ${author.displayName} | Sheytoni`;
  const image = mediaUrl(post.media?.[0]) ?? author.avatar ?? `${SITE_URL}/logo.png`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: excerpt.slice(0, 110),
    articleBody: post.content ?? "",
    datePublished: post.createdAt,
    dateModified: post.updatedAt ?? post.createdAt,
    author: { "@type": "Person", name: author.displayName, url: profileUrl(author) },
    image,
    url,
    isPartOf: { "@type": "WebSite", name: "Sheytoni", url: SITE_URL },
  };
  const mediaHtml = (post.media ?? []).map((m, i) => {
    const src = mediaUrl(m);
    if (!src) return "";
    if (m.type === "video") return `<video controls src="${esc(src)}" width="640" height="360"></video>`;
    return `<img src="${esc(src)}" alt="Post media ${i + 1} by ${esc(author.displayName)}" width="640" height="640" loading="lazy"/>`;
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(excerpt)}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="${esc(url)}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="Sheytoni"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(excerpt)}"/>
  <meta property="og:url" content="${esc(url)}"/>
  <meta property="og:image" content="${esc(image)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(excerpt)}"/>
  <meta name="twitter:image" content="${esc(image)}"/>
  <meta name="rating" content="adult"/>
  ${jsonLdScript(schema)}
  <meta http-equiv="refresh" content="0;url=${esc(url)}"/>
</head>
<body>
  <article>
    <h1>${esc(author.displayName)}</h1>
    <p>${esc(post.content ?? "")}</p>
    ${mediaHtml}
    <p><a href="${esc(url)}">View on Sheytoni</a> · <a href="${esc(profileUrl(author))}">Author profile</a></p>
  </article>
</body>
</html>`;
}

export function handleSeoRequest(req, res, url, db) {
  if (url === "/sitemap.xml" && req.method === "GET") {
    const xml = renderSitemapXml(db);
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" });
    res.end(xml);
    return true;
  }
  if (url === "/robots.txt" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" });
    res.end(renderRobotsTxt());
    return true;
  }
  return false;
}

export function handlePublicHtmlRequest(req, res, url, db) {
  const profileMatch = url.match(/^\/public\/profile\/([^/]+)$/);
  if (profileMatch && req.method === "GET") {
    const html = renderProfileHtml(db, decodeURIComponent(profileMatch[1]));
    if (!html) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!DOCTYPE html><html><body><h1>Profile not found</h1></body></html>");
      return true;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(html);
    return true;
  }
  const postMatch = url.match(/^\/public\/post\/([^/]+)$/);
  if (postMatch && req.method === "GET") {
    const html = renderPostHtml(db, decodeURIComponent(postMatch[1]));
    if (!html) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!DOCTYPE html><html><body><h1>Post not found</h1></body></html>");
      return true;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(html);
    return true;
  }
  return false;
}

export function getSeoMetaForProfile(db, usernameOrId) {
  const user = resolveProfileUser(db, usernameOrId);
  if (!user || user.deleted) return null;
  const pub = publicUser(user);
  return {
    title: `${pub.displayName}${pub.username ? ` (@${pub.username})` : ""} on Sheytoni | شیطونی`,
    description: pub.bio?.trim() || `${pub.displayName} on Sheytoni social community.`,
    canonical: profileUrl(pub),
    image: pub.avatar || `${SITE_URL}/logo.png`,
    noindex: !!user.banned,
  };
}

export function getSeoMetaForPost(db, postId) {
  const post = getPostById(db, postId, null);
  if (!post) return null;
  const excerpt = (post.content ?? "").trim().slice(0, 160) || "Post on Sheytoni";
  return {
    title: `${excerpt.slice(0, 60)} — ${post.author.displayName} | Sheytoni`,
    description: excerpt,
    canonical: postUrl(post.id),
    image: mediaUrl(post.media?.[0]) ?? post.author.avatar ?? `${SITE_URL}/logo.png`,
    noindex: !isPostPublic(post),
  };
}
