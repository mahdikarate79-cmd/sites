import { Donator } from "@/lib/types";

export interface DonateRequest {
  postId: string;
  recipientId: string;
  stars: number;
}

export interface DonateResult {
  success: boolean;
  transactionId?: string;
}

/**
 * Donate Telegram Stars to a post author.
 * Future: Connect to Telegram Stars Invoice API via backend.
 * Backend handles: invoice creation, payment verification, webhook.
 * NEVER expose Telegram Bot Token in frontend.
 */
export async function donateStars(request: DonateRequest): Promise<DonateResult> {
  // TODO: POST /api/donate { postId, recipientId, stars }
  // Backend creates Telegram Stars invoice and returns payment URL
  console.log("[Mock] Donate request:", request);
  return { success: true, transactionId: `mock_${Date.now()}` };
}

export async function getTopDonators(postId: string): Promise<Donator[]> {
  // TODO: GET /api/posts/:postId/donators
  const { mockPosts } = await import("@/data/mock/posts");
  const post = mockPosts.find((p) => p.id === postId);
  return post?.topDonators ?? [];
}
