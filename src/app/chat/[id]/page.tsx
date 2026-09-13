import { AppLayout } from "@/components/layout/AppLayout";
import { ChatConversation } from "@/components/chat/ChatConversation";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
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
