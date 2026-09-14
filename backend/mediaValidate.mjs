/** Sniff image/video type from buffer magic bytes — independent per upload buffer */

const SIGS = [
  { mime: "image/jpeg", ext: ".jpg", match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: ".png", match: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/gif", ext: ".gif", match: (b) => b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { mime: "image/webp", ext: ".webp", match: (b) => b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  { mime: "video/mp4", ext: ".mp4", match: (b) => b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },
  { mime: "video/webm", ext: ".webm", match: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

export function sniffMediaType(buffer, declaredType = "") {
  const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  for (const sig of SIGS) {
    if (sig.match(b)) return { contentType: sig.mime, ext: sig.ext };
  }
  const lower = String(declaredType).toLowerCase();
  if (lower.includes("video")) return { contentType: lower || "video/mp4", ext: ".mp4" };
  if (lower.includes("gif")) return { contentType: "image/gif", ext: ".gif" };
  if (lower.includes("png")) return { contentType: "image/png", ext: ".png" };
  if (lower.includes("webp")) return { contentType: "image/webp", ext: ".webp" };
  if (lower.startsWith("image/")) return { contentType: lower, ext: ".jpg" };
  return null;
}

export function validateMediaBuffer(buffer, declaredType, category) {
  const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (!b.length) return { ok: false, error: "Empty upload" };
  const sniffed = sniffMediaType(b, declaredType);
  if (!sniffed) {
    return { ok: false, error: "The image could not be decoded" };
  }
  const isVideo = sniffed.contentType.startsWith("video/");
  const isImage = sniffed.contentType.startsWith("image/");
  if (!isImage && !isVideo) {
    return { ok: false, error: "File type not allowed" };
  }
  if ((category === "avatar" || category === "cover") && !isImage) {
    return { ok: false, error: "Images only for profile media" };
  }
  return { ok: true, contentType: sniffed.contentType, ext: sniffed.ext, size: b.length };
}
