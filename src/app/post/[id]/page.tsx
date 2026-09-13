import { AppLayout } from "@/components/layout/AppLayout";
import { PostDetailView } from "@/components/feed/PostDetailView";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppLayout hideHeader hideNav>
      <PostDetailView postId={id} />
    </AppLayout>
  );
}
