import { Suspense } from "react";
import { FollowListContent } from "@/components/settings/FollowListContent";

export default function FollowersPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-text-muted text-sm">Loading…</div>}>
      <FollowListContent mode="followers" />
    </Suspense>
  );
}
