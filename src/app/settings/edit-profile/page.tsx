import { AppLayout } from "@/components/layout/AppLayout";
import { EditProfileContent } from "@/components/settings/EditProfileContent";

export default function EditProfilePage() {
  return (
    <AppLayout hideHeader>
      <EditProfileContent />
    </AppLayout>
  );
}
