import { AppLayout } from "@/components/layout/AppLayout";
import { OwnProfile } from "@/components/profile/ProfileContent";

export default function ProfilePage() {
  return (
    <AppLayout hideHeader hideNav>
      <OwnProfile />
    </AppLayout>
  );
}
