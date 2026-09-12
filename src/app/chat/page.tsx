import { AppLayout } from "@/components/layout/AppLayout";
import { ChatList } from "@/components/chat/ChatList";

export default function ChatPage() {
  return (
    <AppLayout title="Messages" hideNav hideHeaderActions backHref="/">
      <ChatList />
    </AppLayout>
  );
}
