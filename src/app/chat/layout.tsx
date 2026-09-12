import { MiniAppGuard } from "@/components/telegram/MiniAppGuard";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <MiniAppGuard>{children}</MiniAppGuard>;
}
