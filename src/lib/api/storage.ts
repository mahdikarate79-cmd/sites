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
  ],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"],
};

export function generateObjectKey(prefix: string, extension: string): string {
  const random = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}/${random}${extension}`;
}

export function validateUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > UPLOAD_VALIDATION.maxSizeBytes) {
    return { valid: false, error: `File exceeds ${UPLOAD_VALIDATION.maxSizeBytes / 1024 / 1024}MB limit` };
  }
  if (!UPLOAD_VALIDATION.allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
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

/** Upload media to Backblaze B2 via backend — never stored on host disk */
export async function uploadMedia(
  file: File,
  category: "avatar" | "cover" | "post" | "chat"
): Promise<UploadResult> {
  const prepared = file.type.startsWith("image/") ? await compressImageIfNeeded(file) : file;
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
