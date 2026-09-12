import { AppLayout } from "@/components/layout/AppLayout";
import { OwnProfile } from "@/components/profile/ProfileContent";
import { MiniAppGuard } from "@/components/telegram/MiniAppGuard";

export default function ProfilePage() {
  return (
    <MiniAppGuard>
      <AppLayout hideHeader hideNav>
        <OwnProfile />
      </AppLayout>
    </MiniAppGuard>
  );
}
