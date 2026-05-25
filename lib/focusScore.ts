
export type HourRow = {
  hour: number;       // 0..23
  commits: number;
  meetings: number;
  pings: number;      // chat interruptions (e.g. Discord mentions)
};

export type FocusResult = {
  score: number;          // 0..100
  switches: number;       // hours where coding collided with a meeting/ping
  focusHours: number;     // hours of uninterrupted coding
  longestBlockMins: number;
  taxMinutes: number;     // estimated refocus cost
  worstHour: number | null;
};

const REFOCUS_TAX_MINS = 15;

export function focusScore(rows: HourRow[]): FocusResult {
  const switches = rows.filter(
    (r) => r.commits > 0 && (r.meetings > 0 || r.pings > 0)
  ).length;

  const focusRows = rows.filter(
    (r) => r.commits > 0 && r.meetings === 0 && r.pings === 0
  );
  const focusHours = focusRows.length;

  const activeHours =
    rows.filter((r) => r.commits + r.meetings + r.pings > 0).length || 1;

  // longest contiguous run of focus hours
  let longest = 0;
  let run = 0;
  for (const r of rows.sort((a, b) => a.hour - b.hour)) {
    const isFocus = r.commits > 0 && r.meetings === 0 && r.pings === 0;
    run = isFocus ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // worst hour = most sources colliding, tie-broken by total volume
  let worstHour: number | null = null;
  let worstScore = -1;
  for (const r of rows) {
    const sources =
      (r.commits > 0 ? 1 : 0) + (r.meetings > 0 ? 1 : 0) + (r.pings > 0 ? 1 : 0);
    const volume = r.commits + r.meetings + r.pings;
    const s = sources * 100 + volume;
    if (sources >= 2 && s > worstScore) {
      worstScore = s;
      worstHour = r.hour;
    }
  }

  const raw = (focusHours / activeHours) * 100 - switches * 4;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    switches,
    focusHours,
    longestBlockMins: longest * 60,
    taxMinutes: switches * REFOCUS_TAX_MINS,
    worstHour,
  };
}
