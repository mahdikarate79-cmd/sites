import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileLoader } from "@/components/profile/ProfileLoader";

export function generateStaticParams() {
  return [{ username: "placeholder" }];
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <AppLayout hideHeader hideNav>
      <ProfileLoader username={username} />
    </AppLayout>
  );
}
