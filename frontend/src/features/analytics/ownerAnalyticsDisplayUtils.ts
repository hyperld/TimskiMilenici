import type { OverviewResult, PeakTimeBucket } from './services/ownerAnalyticsService';

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

export function buildOverviewSparklinePoints(overview: OverviewResult | null): string {
  if (!overview || !overview.points.length) return '0,50 100,50';
  const values = overview.points.map((p) => p.bookings);
  const max = Math.max(...values, 1);
  const step = 100 / Math.max(values.length - 1, 1);
  return values
    .map((v, idx) => {
      const x = idx * step;
      const y = 55 - (v / max) * 40;
      return `${x},${y}`;
    })
    .join(' ');
}

/** Backend uses 0=Sun..6=Sat; UI shows Mon-first for owners */
export const DOW_SHORT_MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function reorderDowSumsMonFirst(sumsSunFirst: number[]): number[] {
  const s = sumsSunFirst;
  return [s[1], s[2], s[3], s[4], s[5], s[6], s[0]];
}

export function aggregateBookingsByDayOfWeek(buckets: PeakTimeBucket[] | null): number[] {
  const sums = new Array<number>(7).fill(0);
  if (!buckets?.length) return sums;
  buckets.forEach((b) => {
    const idx = Math.max(0, Math.min(6, b.dayOfWeek));
    sums[idx] += b.bookings;
  });
  return sums;
}

export function peakDayBarHeights(sums: number[]): number[] {
  const max = Math.max(...sums, 1);
  return sums.map((v) => (max === 0 ? 8 : Math.max(8, (v / max) * 100)));
}

export function topBusyHours(buckets: PeakTimeBucket[] | null, limit = 3): { hour: number; bookings: number }[] {
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
