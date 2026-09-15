/** Copy file bytes into memory so uploads survive stale picker references (Telegram WebView). */
export async function snapshotFile(file: File): Promise<File> {
  const name = file.name || "upload.jpg";
  const type = file.type || inferMimeFromName(name);

  try {
    const buffer = await file.arrayBuffer();
    if (!buffer.byteLength) throw new Error("Empty file");
    return new File([buffer], name, { type });
  } catch {
    try {
      const slice = file.slice(0, file.size, type);
      return new File([slice], name, { type });
    } catch {
      throw new Error("Could not read file — please select it again");
    }
  }
}

function inferMimeFromName(name: string): string {
  const ext = "." + (name.split(".").pop()?.toLowerCase() ?? "");
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
  return map[ext] ?? "application/octet-stream";
}
