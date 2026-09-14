/** Gregorian English dates for UI (avoids locale-specific calendars). */
export function formatDateEn(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    timeZone: "UTC",
    ...opts,
  });
}

export function formatDateShortEn(date: string | Date | null | undefined): string {
  return formatDateEn(date, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTimeEn(date: string | Date | null | undefined): string {
  return formatDateEn(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
