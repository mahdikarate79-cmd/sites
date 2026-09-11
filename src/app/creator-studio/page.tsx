import { AppLayout } from "@/components/layout/AppLayout";
import { CreatorStudioContent } from "@/components/creator/CreatorStudioContent";

export default function CreatorStudioPage() {
  return (
    <AppLayout hideHeader>
      <CreatorStudioContent />
    </AppLayout>
  );
}
