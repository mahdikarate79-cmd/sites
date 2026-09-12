"use client";

import Link from "next/link";
import { useAssetPath } from "@/lib/hooks/useAssetPath";

export function Logo() {
  const logoSrc = useAssetPath("/logo.png");

  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <img
        src={logoSrc}
        alt="Sheytoni"
        width={32}
        height={32}
        className="w-8 h-8 object-contain"
        draggable={false}
      />
      <span className="text-lg font-semibold text-text tracking-tight">Sheytoni</span>
    </Link>
  );
}
