import { MediaObject, UploadValidation } from "@/lib/types";

import { getApiBase } from "./base";
import { getAuthHeaders } from "./tokens";

export const UPLOAD_VALIDATION: UploadValidation = {
  maxSizeBytes: 50 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
    "video/mpeg",
  ],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov", ".m4v"],
};

export function generateObjectKey(prefix: string, extension: string): string {
  const random = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}/${random}${extension}`;
}

function inferMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/mp4",
    ".m4v": "video/mp4",
  };
  return map[ext] ?? "";
}

export function validateUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > UPLOAD_VALIDATION.maxSizeBytes) {
    return { valid: false, error: `File exceeds ${UPLOAD_VALIDATION.maxSizeBytes / 1024 / 1024}MB limit` };
  }
  const mime = inferMimeType(file);
  if (!mime || !UPLOAD_VALIDATION.allowedMimeTypes.includes(mime)) {
    return { valid: false, error: "File type not allowed" };
  }
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  if (!UPLOAD_VALIDATION.allowedExtensions.includes(ext)) {
    return { valid: false, error: "File extension not allowed" };
  }
  return { valid: true };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getSignedMediaUrl(objectKey: string): Promise<string> {
  return `${getApiBase()}/api/media/${encodeURIComponent(objectKey)}`;
}

export interface UploadResult {
  objectKey: string;
  media: MediaObject;
}

async function compressImageIfNeeded(file: File, maxDim = 2048): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size < 2 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

function normalizeVideoMime(file: File): File {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  if (file.type === "video/quicktime" || ext === ".mov") {
    return new File([file], file.name.replace(/\.mov$/i, ".mp4") || "video.mp4", { type: "video/mp4" });
  }
  if ((file.type === "video/x-m4v" || ext === ".m4v") && file.type !== "video/mp4") {
    return new File([file], file.name.replace(/\.m4v$/i, ".mp4") || "video.mp4", { type: "video/mp4" });
  }
  return file;
}

/** Upload media to Backblaze B2 via backend — never stored on host disk */
export async function uploadMedia(
  file: File,
  category: "avatar" | "cover" | "post" | "chat",
  options?: { maxImageDim?: number }
): Promise<UploadResult> {
  let prepared = file;
  if (!prepared.type) {
    const inferred = inferMimeType(file);
    if (inferred) prepared = new File([file], file.name, { type: inferred });
  }
  if (prepared.type.startsWith("image/")) {
    const maxDim = options?.maxImageDim ?? (category === "avatar" ? 512 : category === "cover" ? 1600 : 2048);
    prepared = await compressImageIfNeeded(file, maxDim);
  } else if (file.type.startsWith("video/") || /\.(mov|m4v|mp4|webm)$/i.test(file.name)) {
    prepared = normalizeVideoMime(file);
  }
  const validation = validateUpload(prepared);
  if (!validation.valid) throw new Error(validation.error);

  const data = await fileToBase64(prepared);
  const res = await fetch(`${getApiBase()}/api/storage/upload`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ data, contentType: prepared.type, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }
  const result = await res.json();
  return {
    objectKey: result.objectKey,
    media: {
      objectKey: result.objectKey,
      mimeType: prepared.type,
      size: prepared.size,
      url: result.url,
    },
  };
}
