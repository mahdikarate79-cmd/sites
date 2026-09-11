import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { getUserByUsername, mockUsers } from "@/data/mock/users";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return mockUsers.map((u) => ({ username: u.username }));
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = getUserByUsername(username);
  if (!user) notFound();

  return (
    <AppLayout>
      <ProfileContent user={user} />
    </AppLayout>
  );
}
