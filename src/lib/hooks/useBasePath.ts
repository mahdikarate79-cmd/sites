"use client";

export function useBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function withBasePath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
