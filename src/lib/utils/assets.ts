/** Resolve a public asset path with optional GitHub Pages base path. */
export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const { pathname } = window.location;
    if (pathname === "/sites" || pathname.startsWith("/sites/")) {
      return `/sites${normalized}`;
    }
  }

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${normalized}`;
}
