import { MediaObject, UploadValidation } from "@/lib/types";

import { getApiBase } from "./base";
import { apiFetch } from "./fetch";
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

const CATEGORY_LIMITS: Record<string, { free: number; premium: number }> = {
  avatar: { free: 2 * 1024 * 1024, premium: 2 * 1024 * 1024 },
  cover: { free: 3 * 1024 * 1024, premium: 3 * 1024 * 1024 },
  post: { free: 10 * 1024 * 1024, premium: 1024 * 1024 * 1024 },
  chat: { free: 10 * 1024 * 1024, premium: 1024 * 1024 * 1024 },
};

const IMAGE_DIMS: Record<string, number> = {
  avatar: 256,
  cover: 960,
  post: 1600,
  chat: 1280,
};

const JSON_UPLOAD_MAX = 3 * 1024 * 1024;

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

export function validateUpload(file: File, category: keyof typeof CATEGORY_LIMITS = "post", isPremium = false): { valid: boolean; error?: string } {
  const limit = CATEGORY_LIMITS[category] ?? CATEGORY_LIMITS.post;
  const maxSize = isPremium ? limit.premium : limit.free;
  if (file.size > maxSize) {
    return { valid: false, error: `File exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit` };
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

async function compressImage(file: File, maxDim: number, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
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

async function prepareUploadFile(
  file: File,
  category: "avatar" | "cover" | "post" | "chat",
  options?: { maxImageDim?: number }
): Promise<File> {
  let prepared = file;
  if (!prepared.type) {
    const inferred = inferMimeType(file);
    if (inferred) prepared = new File([file], file.name, { type: inferred });
  }
  if (prepared.type.startsWith("image/")) {
    const maxDim = options?.maxImageDim ?? IMAGE_DIMS[category] ?? 1600;
    const quality = category === "avatar" ? 0.8 : category === "cover" ? 0.78 : 0.82;
    prepared = await compressImage(prepared, maxDim, quality);
  } else if (prepared.type.startsWith("video/") || /\.(mov|m4v|mp4|webm)$/i.test(file.name)) {
    prepared = normalizeVideoMime(prepared);
  }
  return prepared;
}

export interface UploadResult {
  objectKey: string;
  media: MediaObject;
}

function parseUploadResponse(xhr: XMLHttpRequest): { objectKey?: string; url?: string; size?: number; error?: string; message?: string } {
  if (xhr.response && typeof xhr.response === "object") {
    return xhr.response as { objectKey?: string; url?: string; size?: number; error?: string; message?: string };
  }
  const text = xhr.responseText?.trim();
  if (!text) return {};
  try {
    return JSON.parse(text) as { objectKey?: string; url?: string; size?: number; error?: string; message?: string };
  } catch {
    return { error: text.slice(0, 120) };
  }
}

function uploadErrorMessage(xhr: XMLHttpRequest, data: { error?: string; message?: string }): string {
  const code = data.error ?? data.message;
  if (code === "storage_unavailable" || code === "b2_upload_failed") {
    return "Media storage is temporarily unavailable. Please try again.";
  }
  if (code) return code;
  if (xhr.status === 401) return "Please sign in again";
  if (xhr.status === 413) return "File is too large";
  if (xhr.status >= 400) return `Upload failed (${xhr.status})`;
  return "Upload failed — check your connection";
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function uploadJson(
  file: File,
  category: string
): Promise<{ objectKey: string; url: string; size: number }> {
  const data = await fileToBase64(file);
  return apiFetch<{ objectKey: string; url: string; size: number }>("/api/storage/upload", {
    method: "POST",
    body: JSON.stringify({
      data,
      contentType: file.type || "application/octet-stream",
      category,
    }),
  });
}

function uploadBinary(
  file: File,
  category: string,
  onProgress?: (pct: number) => void
): Promise<{ objectKey: string; url: string; size: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${getApiBase()}/api/storage/upload/binary?category=${encodeURIComponent(category)}`;
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.responseType = "json";
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    const auth = getAuthHeaders();
    for (const [key, value] of Object.entries(auth)) {
      if (value) xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const data = parseUploadResponse(xhr);
      if (xhr.status >= 200 && xhr.status < 300 && data.objectKey) {
        resolve({ objectKey: data.objectKey, url: data.url ?? "", size: data.size ?? file.size });
        return;
      }
      reject(new Error(uploadErrorMessage(xhr, data)));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(file);
  });
}

async function uploadWithFallback(
  file: File,
  category: string,
  onProgress?: (pct: number) => void
): Promise<{ objectKey: string; url: string; size: number }> {
  const preferJson = file.size <= JSON_UPLOAD_MAX && (category === "avatar" || category === "cover");
  if (preferJson) {
    try {
      return await uploadJson(file, category);
    } catch {
      // Fall through to binary upload
    }
  }

  try {
    return await uploadBinary(file, category, onProgress);
  } catch (binaryError) {
    if (file.size <= JSON_UPLOAD_MAX) {
      return uploadJson(file, category);
    }
    throw binaryError;
  }
}

/** Upload media via backend — B2 with local fallback, binary with JSON fallback for small files */
export async function uploadMedia(
  file: File,
  category: "avatar" | "cover" | "post" | "chat",
  options?: { maxImageDim?: number; onProgress?: (pct: number) => void; isPremium?: boolean }
): Promise<UploadResult> {
  const prepared = await prepareUploadFile(file, category, options);
  const validation = validateUpload(prepared, category, options?.isPremium);
  if (!validation.valid) throw new Error(validation.error);

  const result = await uploadWithFallback(prepared, category, options?.onProgress);
  return {
    objectKey: result.objectKey,
    media: {
      objectKey: result.objectKey,
      mimeType: prepared.type,
      size: result.size ?? prepared.size,
      url: result.url,
    },
  };
}

export async function getSignedMediaUrl(objectKey: string): Promise<string> {
  return `${getApiBase()}/api/media/${encodeURIComponent(objectKey)}`;
}
