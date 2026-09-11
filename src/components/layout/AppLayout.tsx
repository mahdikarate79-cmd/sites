"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function AppLayout({ children, title, hideNav, hideHeader }: AppLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      {!hideHeader && <Header title={title} />}
      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
