import type { OverviewResult, PeakTimeBucket, ProductSalesRow } from './services/ownerAnalyticsService';

export function getDefaultAnalyticsRange(): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(fromDate), to: fmt(toDate) };
}

export function formatRangeLabel(from: string, to: string): string {
  try {
    const a = new Date(from + 'T12:00:00');
    const b = new Date(to + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${a.toLocaleDateString(undefined, opts)} – ${b.toLocaleDateString(undefined, {
      ...opts,
      year: a.getFullYear() !== b.getFullYear() ? 'numeric' : undefined,
    })}`;
  } catch {
    return `${from} – ${to}`;
  }
}

const VB = { w: 100, h: 56, padL: 2, padR: 2, padT: 4, padB: 6 };

/** Matches booking/revenue polylines and stacked bars */
export const OVERVIEW_CHART_VIEWBOX = `0 0 ${VB.w} ${VB.h}`;

function innerBox() {
  return {
    w: VB.w - VB.padL - VB.padR,
    h: VB.h - VB.padT - VB.padB,
    x0: VB.padL,
    y0: VB.padT,
  };
}

/** Polyline points for daily bookings (y inverted), viewBox matches VB */
export function buildBookingsPolyline(overview: OverviewResult | null): string {
  if (!overview?.points.length) return `${VB.padL},${VB.padT + innerBox().h / 2} ${VB.w - VB.padR},${VB.padT + innerBox().h / 2}`;
  const { w, h, x0, y0 } = innerBox();
  const values = overview.points.map((p) => p.bookings);
  const max = Math.max(...values, 1);
  const n = values.length;
  const step = n <= 1 ? w : w / (n - 1);
  return values
    .map((v, idx) => {
      const x = x0 + (n <= 1 ? w / 2 : idx * step);
      const yn = y0 + h - (v / max) * h * 0.92;
      return `${x},${yn}`;
    })
    .join(' ');
}

export function buildRevenuePolyline(overview: OverviewResult | null): string {
  if (!overview?.points.length) return `${VB.padL},${VB.padT + innerBox().h / 2} ${VB.w - VB.padR},${VB.padT + innerBox().h / 2}`;
  const { w, h, x0, y0 } = innerBox();
  const values = overview.points.map((p) => p.revenue);
  const max = Math.max(...values, 1);
  const n = values.length;
  const step = n <= 1 ? w : w / (n - 1);
  return values
    .map((v, idx) => {
      const x = x0 + (n <= 1 ? w / 2 : idx * step);
      const yn = y0 + h - (v / max) * h * 0.92;
      return `${x},${yn}`;
    })
    .join(' ');
}

export type StackedDailyBar = {
  x: number;
  w: number;
  yComplete: number;
  hComplete: number;
  yCancel: number;
  hCancel: number;
};

export function buildStackedDailyBars(overview: OverviewResult | null): StackedDailyBar[] {
  if (!overview?.points.length) return [];
  const { w, h, x0, y0 } = innerBox();
  const n = overview.points.length;
  const slot = w / n;
  const barW = slot * 0.72;
  const maxStack = Math.max(
    1,
    ...overview.points.map((p) => p.completed + p.cancelled),
  );
  return overview.points.map((p, i) => {
    const x = x0 + i * slot + (slot - barW) / 2;
    const hC = (p.completed / maxStack) * h * 0.92;
    const hCan = (p.cancelled / maxStack) * h * 0.92;
    const stackH = hC + hCan;
    const yTop = y0 + h - stackH;
    return {
      x,
      w: barW,
      yComplete: yTop + hCan,
      hComplete: hC,
      yCancel: yTop,
      hCancel: hCan,
    };
  });
}

/** 7 rows (Mon–Sun) × 12 columns (2-hour buckets covering 24h) */
export function buildPeakDemandMatrix12(buckets: PeakTimeBucket[] | null): { rows: number[][]; max: number } {
  const rows = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => 0));
  if (!buckets?.length) return { rows, max: 0 };
  buckets.forEach((b) => {
    const monFirst = (b.dayOfWeek + 6) % 7;
    const col = Math.min(11, Math.floor(Math.max(0, Math.min(23, b.hour)) / 2));
    rows[monFirst][col] += b.bookings;
  });
  const max = Math.max(0, ...rows.flat());
  return { rows, max };
}

export function topBusyHours(
  buckets: PeakTimeBucket[] | null,
  limit = 6,
): { hour: number; bookings: number }[] {
  if (!buckets?.length) return [];
  const byHour = new Map<number, number>();
  buckets.forEach((b) => {
    byHour.set(b.hour, (byHour.get(b.hour) ?? 0) + b.bookings);
  });
  return [...byHour.entries()]
    .map(([hour, bookings]) => ({ hour, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, limit);
}

export function topServicesByRevenue(rows: ProductSalesRow[] | null): ProductSalesRow[] {
  if (!rows?.length) return [];
  return [...rows].sort((a, b) => b.revenue - a.revenue);
}

export function serviceBarPercent(revenue: number, maxRevenue: number): number {
  if (maxRevenue <= 0) return 0;
  return Math.min(100, (revenue / maxRevenue) * 100);
}
