const TZ = "America/Chicago";
const DAY = 86_400_000;

export type Week = {
  /** Tuesday 00:01 America/Chicago */
  start: Date;
  /** Monday 23:59:59 America/Chicago */
  end: Date;
  /** Chicago calendar dates, YYYY-MM-DD */
  startDate: string;
  endDate: string;
  label: string;
};

type Parts = { y: number; m: number; d: number; h: number; mi: number; s: number; dow: number };

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  weekday: "short",
});

const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function chicagoParts(instant: number): Parts {
  const get: Record<string, string> = {};
  for (const p of partsFormat.formatToParts(new Date(instant))) get[p.type] = p.value;
  return {
    y: Number(get.year),
    m: Number(get.month),
    d: Number(get.day),
    h: Number(get.hour),
    mi: Number(get.minute),
    s: Number(get.second),
    dow: DOW[get.weekday],
  };
}

/** Chicago's offset from UTC at an instant, in ms (negative). */
function chicagoOffset(instant: number): number {
  const p = chicagoParts(instant);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Converts a Chicago wall-clock time to a real instant. */
function chicagoWallToInstant(date: Date, h: number, mi: number, s: number): Date {
  const guess = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, mi, s);
  let result = guess - chicagoOffset(guess);
  result = guess - chicagoOffset(result);
  return new Date(result);
}

const labelFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});
const yearFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric" });

/** The most recent Tuesday 00:01 to Monday 23:59:59 (America/Chicago) window that has ended. */
export function lastCompletedWeek(now: Date): Week {
  const t = chicagoParts(now.getTime());
  const today = Date.UTC(t.y, t.m - 1, t.d);
  // Most recent Monday whose 23:59:59 has passed. Today, if Monday, is still in progress.
  const back = t.dow === 1 ? 7 : (t.dow - 1 + 7) % 7;
  const monday = new Date(today - back * DAY);
  const tuesday = new Date(monday.getTime() - 6 * DAY);

  return {
    start: chicagoWallToInstant(tuesday, 0, 1, 0),
    end: chicagoWallToInstant(monday, 23, 59, 59),
    startDate: tuesday.toISOString().slice(0, 10),
    endDate: monday.toISOString().slice(0, 10),
    label: `${labelFormat.format(tuesday)} to ${labelFormat.format(monday)}, ${yearFormat.format(monday)}`,
  };
}
