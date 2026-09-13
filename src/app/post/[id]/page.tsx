import { AppLayout } from "@/components/layout/AppLayout";
import { PostDetailView } from "@/components/feed/PostDetailView";
import { mockPosts } from "@/data/mock/posts";

export function generateStaticParams() {
  return mockPosts.map((p) => ({ id: p.id }));
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppLayout>
      <PostDetailView postId={id} />
    </AppLayout>
  );
}
