import { AppLayout } from "@/components/layout/AppLayout";
import { FeedList } from "@/components/feed/FeedList";

export default function HomePage() {
  return (
    <AppLayout>
      <FeedList />
    </AppLayout>
  );
}
