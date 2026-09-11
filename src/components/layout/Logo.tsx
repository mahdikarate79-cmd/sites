import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <div
        className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center"
        aria-label="Sheytoni logo placeholder"
      >
        <span className="text-xs font-bold text-text">S</span>
      </div>
      <span className="text-lg font-semibold text-text tracking-tight">Sheytoni</span>
    </Link>
  );
}
