"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, SquarePlus, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PremiumParticles } from "@/components/ui/PremiumParticles";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore/", icon: Search, label: "Search" },
  { href: "/new-post/", icon: SquarePlus, label: "Create Post" },
  { href: "/profile/", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(href.replace(/\/$/, ""));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 mb-1 safe-bottom pointer-events-none">
      <div className="glass-nav rounded-2xl max-w-sm mx-auto pointer-events-auto">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors",
                  active ? "text-text" : "text-text-muted"
                )}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                {active && <PremiumParticles count={4} centered />}
                <Icon className={cn("w-5 h-5 relative z-[1]", active && "stroke-[2.5]")} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
