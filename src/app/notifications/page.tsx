import { NotificationsContent } from "@/components/notifications/NotificationsContent";
import { MiniAppGuard } from "@/components/telegram/MiniAppGuard";

export default function NotificationsPage() {
  return (
    <MiniAppGuard>
      <NotificationsContent />
    </MiniAppGuard>
  );
}
