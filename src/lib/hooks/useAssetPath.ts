"use client";

import { useEffect, useState } from "react";
import { assetPath } from "@/lib/utils/assets";

/** Resolves asset path after mount for GitHub Pages subpath support. */
export function useAssetPath(path: string): string {
  const [href, setHref] = useState(() => assetPath(path));
  useEffect(() => {
    setHref(assetPath(path));
  }, [path]);
  return href;
}
