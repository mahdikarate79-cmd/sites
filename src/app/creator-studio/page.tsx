import { AppLayout } from "@/components/layout/AppLayout";
import { CreatorStudioContent } from "@/components/creator/CreatorStudioContent";
import { MiniAppGuard } from "@/components/telegram/MiniAppGuard";

export default function CreatorStudioPage() {
  return (
    <MiniAppGuard>
      <AppLayout hideHeader>
        <CreatorStudioContent />
      </AppLayout>
    </MiniAppGuard>
  );
}
