import { AppLayout } from "@/components/layout/AppLayout";
import { ChatLoader } from "@/components/chat/ChatLoader";

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
      <ChatLoader chatId={id} />
    </AppLayout>
  );
}
