export interface MonthlyBucket {
  year: number;
  month: number;
  key: string;
}

/**
 * Resolve the year/month bucket for quota calculations using an explicit timezone.
 * Keeps logic free of external dependencies while remaining DST-safe.
 */
export function getMonthlyBucket(now = Date.now(), tz = "America/Sao_Paulo"): MonthlyBucket {
  const date = new Date(now);
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error("invalid_monthly_bucket_parts");
  }

  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, "0")}`,
  };
}
