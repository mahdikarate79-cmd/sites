import { MiniAppGuard } from "@/components/telegram/MiniAppGuard";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <MiniAppGuard>{children}</MiniAppGuard>;
}
