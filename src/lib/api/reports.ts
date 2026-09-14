import { apiFetch } from "./fetch";

export async function submitReport(body: {
  postId?: string;
  userId?: string;
  category: string;
  subcategory?: string;
  detail?: string;
}): Promise<void> {
  await apiFetch("/api/reports", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
