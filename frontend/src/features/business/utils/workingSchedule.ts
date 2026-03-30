export const DAYS_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type DayOfWeekKey = (typeof DAYS_ORDER)[number];

export interface WorkingDaySlot {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

export type WorkingSchedule = Record<DayOfWeekKey, WorkingDaySlot>;

export function createDefaultWorkingSchedule(): WorkingSchedule {
  const s = {} as WorkingSchedule;
  for (const d of DAYS_ORDER) {
    const weekend = d === 'SATURDAY' || d === 'SUNDAY';
    s[d] = { enabled: !weekend, openTime: '09:00', closeTime: '17:00' };
  }
  return s;
}

/** Map JS getDay() (0=Sunday) to API day key. */
export function dateStrToDayKey(dateStr: string): DayOfWeekKey {
  const d = new Date(`${dateStr}T12:00:00`);
  const n = d.getDay();
  const keys: DayOfWeekKey[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return keys[n];
}

export function normalizeWorkingSchedule(raw: unknown): WorkingSchedule {
  const base = createDefaultWorkingSchedule();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, Partial<WorkingDaySlot>>;
  for (const d of DAYS_ORDER) {
    const v = obj[d];
    if (v && typeof v === 'object') {
      base[d] = {
        enabled: Boolean(v.enabled),
        openTime: typeof v.openTime === 'string' ? v.openTime : base[d].openTime,
        closeTime: typeof v.closeTime === 'string' ? v.closeTime : base[d].closeTime,
      };
    }
  }
  return base;
}

export function serializeWorkingScheduleForApi(schedule: WorkingSchedule): Record<string, WorkingDaySlot> {
  const out: Record<string, WorkingDaySlot> = {};
  for (const d of DAYS_ORDER) {
    out[d] = { ...schedule[d] };
  }
  return out;
}

export function validateWorkingSchedule(schedule: WorkingSchedule): string | null {
  let enabled = 0;
  for (const d of DAYS_ORDER) {
    const slot = schedule[d];
    if (slot.enabled) {
      enabled++;
      if (!slot.openTime?.trim() || !slot.closeTime?.trim()) {
        return `Set open and close times for ${d}`;
      }
      const [oh, om] = slot.openTime.split(':').map(Number);
      const [ch, cm] = slot.closeTime.split(':').map(Number);
      const openM = oh * 60 + (om || 0);
      const closeM = ch * 60 + (cm || 0);
      if (Number.isNaN(openM) || Number.isNaN(closeM) || openM >= closeM) {
        return `Open time must be before close time (${d})`;
      }
    }
  }
  if (enabled < 1) return 'Enable at least one working day';
  return null;
}

/** 30-minute start times where start + stepMinutes fits in [open, close]. */
export function generateTimeSlotsForDate(
  dateStr: string,
  schedule: WorkingSchedule,
  stepMinutes = 30
): string[] {
  const day = dateStrToDayKey(dateStr);
  const slot = schedule[day];
  if (!slot?.enabled) return [];

  const parse = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const openM = parse(slot.openTime);
  const closeM = parse(slot.closeTime);
  if (Number.isNaN(openM) || Number.isNaN(closeM) || openM >= closeM) return [];

  const out: string[] = [];
  let cur = openM;
  while (cur + stepMinutes <= closeM) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    cur += stepMinutes;
  }
  return out;
}

export function countSlotsForDate(dateStr: string, schedule: WorkingSchedule, stepMinutes = 30): number {
  return generateTimeSlotsForDate(dateStr, schedule, stepMinutes).length;
}

function toLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Dates to disable in booking calendars: closed days or all bookable slots taken.
 */
export function buildCalendarUnavailableDates(
  schedule: WorkingSchedule,
  bookedTimesByDate: Record<string, string[]>,
  monthsBack = 2,
  monthsForward = 24
): string[] {
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  start.setDate(1);
  const end = new Date();
  end.setMonth(end.getMonth() + monthsForward);
  const out = new Set<string>();
  for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toLocalYmd(d);
    const cap = countSlotsForDate(dateStr, schedule);
    if (cap <= 0) {
      out.add(dateStr);
      continue;
    }
    const n = bookedTimesByDate[dateStr]?.length ?? 0;
    if (n >= cap) out.add(dateStr);
  }
  return Array.from(out);
}
