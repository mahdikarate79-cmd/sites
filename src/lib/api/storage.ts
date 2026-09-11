import { MediaObject, UploadValidation } from "@/lib/types";

/**
 * Object Storage architecture for Cloudflare R2.
 * Files are never stored on the main host disk.
 * Database stores only metadata and object keys.
 */

export const UPLOAD_VALIDATION: UploadValidation = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
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

/**
 * Request a signed upload URL from the backend.
 * Backend validates auth, rate limits, and returns a pre-signed R2 URL.
 */
export async function requestUploadUrl(
  file: File,
  category: "avatar" | "cover" | "post" | "chat"
): Promise<{ uploadUrl: string; objectKey: string }> {
  // TODO: Connect to backend API
  // POST /api/storage/upload-url { mimeType, size, category }
  void file;
  void category;
  throw new Error("Upload API not connected. Implement backend endpoint.");
}

/**
 * Get a signed download URL for a media object.
 * URLs are time-limited and non-guessable.
 */
export async function getSignedMediaUrl(objectKey: string): Promise<string> {
  // TODO: Connect to backend API
  // GET /api/storage/media/:objectKey → signed URL
  return `/api/media/${objectKey}`;
}

export interface UploadResult {
  objectKey: string;
  media: MediaObject;
}

export async function uploadMedia(
  file: File,
  category: "avatar" | "cover" | "post" | "chat"
): Promise<UploadResult> {
  const validation = validateUpload(file);
  if (!validation.valid) throw new Error(validation.error);

  const { objectKey } = await requestUploadUrl(file, category);

  // TODO: PUT file to signed uploadUrl
  // const { uploadUrl, objectKey } = await requestUploadUrl(file, category);
  // await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

  return {
    objectKey,
    media: {
      objectKey,
      mimeType: file.type,
      size: file.size,
      url: await getSignedMediaUrl(objectKey),
    },
  };
}
