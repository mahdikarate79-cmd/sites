"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";

type GatedLinkProps = ComponentProps<typeof Link>;

export function GatedLink({ href, onClick, ...props }: GatedLinkProps) {
  const { requireMiniApp } = useTelegramGate();

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!requireMiniApp()) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
}
