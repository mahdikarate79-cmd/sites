"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { BadgeSync } from "./BadgeSync";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
  hideHeader?: boolean;
  hideHeaderActions?: boolean;
  noPadding?: boolean;
  fullHeight?: boolean;
  backHref?: string;
}

export function AppLayout({ children, title, hideNav, hideHeader, hideHeaderActions, noPadding, fullHeight, backHref }: AppLayoutProps) {
  return (
    <div className={fullHeight ? "h-dvh flex flex-col overflow-hidden" : "min-h-dvh flex flex-col"}>
      <BadgeSync />
      {!hideHeader && <Header title={title} hideActions={hideHeaderActions} backHref={backHref} />}
      <main className={`flex-1 max-w-2xl mx-auto w-full ${fullHeight ? "h-full overflow-hidden p-0" : ""} ${!noPadding && !fullHeight ? "pb-24" : ""}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
