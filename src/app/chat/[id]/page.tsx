import { AppLayout } from "@/components/layout/AppLayout";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { mockChats } from "@/data/mock/chats";

export function generateStaticParams() {
  return mockChats.map((c) => ({ id: c.id }));
}

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppLayout hideNav hideHeader noPadding fullHeight>
      <ChatConversation chatId={id} />
    </AppLayout>
  );
}
