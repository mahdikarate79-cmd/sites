import { AppLayout } from "@/components/layout/AppLayout";
import { ExploreContent } from "@/components/explore/ExploreContent";

export default function ExplorePage() {
  return (
    <AppLayout hideHeader hideHeaderActions>
      <ExploreContent />
    </AppLayout>
  );
}
