/**
 * Backblaze B2 object storage — media never touches host disk.
 * Requires: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME
 */

let authCache = null;
let authExpires = 0;

async function authorize() {
  if (authCache && Date.now() < authExpires) return authCache;

  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  if (!keyId || !appKey) throw new Error("B2 credentials not configured");

  const res = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${appKey}`).toString("base64")}` },
  });
  if (!res.ok) throw new Error(`B2 auth failed: ${res.status}`);
  authCache = await res.json();
  authExpires = Date.now() + 23 * 60 * 60 * 1000;
  return authCache;
}

async function getUploadUrl() {
  const auth = await authorize();
  const bucketName = process.env.B2_BUCKET_NAME;
  const bucketId = process.env.B2_BUCKET_ID;
  if (!bucketName && !bucketId) throw new Error("B2_BUCKET_NAME or B2_BUCKET_ID required");

  let resolvedBucketId = bucketId;
  if (!resolvedBucketId) {
    const listRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: "POST",
      headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: auth.accountId, bucketName }),
    });
    const list = await listRes.json();
    resolvedBucketId = list.buckets?.[0]?.bucketId;
  }
  if (!resolvedBucketId) throw new Error("B2 bucket not found");

  const upRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: "POST",
    headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
    body: JSON.stringify({ bucketId: resolvedBucketId }),
  });
  if (!upRes.ok) throw new Error(`B2 upload URL failed: ${upRes.status}`);
  return { ...(await upRes.json()), auth };
}

export async function uploadToB2(objectKey, buffer, contentType) {
  const { uploadUrl, authorizationToken, auth } = await getUploadUrl();
  const sha1 = await import("crypto").then((c) =>
    c.createHash("sha1").update(buffer).digest("hex")
  );

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(objectKey),
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      "X-Bz-Content-Sha1": sha1,
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`B2 upload failed: ${res.status}`);
  const data = await res.json();
  const publicBase = process.env.B2_PUBLIC_URL ?? auth.downloadUrl;
  return {
    objectKey,
    fileId: data.fileId,
    fileName: data.fileName,
    url: `${publicBase}/file/${process.env.B2_BUCKET_NAME}/${objectKey}`,
    size: buffer.length,
    contentType,
  };
}

export async function deleteFromB2(fileId, fileName) {
  const auth = await authorize();
  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: "POST",
    headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, fileName }),
  });
  if (!res.ok) throw new Error(`B2 delete failed: ${res.status}`);
  return true;
}

export function isB2Configured() {
  return !!(process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY && process.env.B2_BUCKET_NAME);
}
