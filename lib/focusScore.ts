export type HourRow = { hour: number; commits: number; meetings: number; pings: number };

export type FocusResult = {
  score: number; switches: number; focusHours: number;
  longestBlockMins: number; taxMinutes: number; worstHour: number | null;
};

export const CONFIG = {
  refocusTaxMins: 15,
  switchPenalty: 2.5,
  focusBonus: 6,
  base: 40,
};

export function focusScore(rows: HourRow[]): FocusResult {
  const switches = rows.filter(r => r.commits > 0 && (r.meetings > 0 || r.pings > 0)).length;
  const focusHours = rows.filter(r => r.commits > 0 && r.meetings === 0 && r.pings === 0).length;

  let longest = 0, run = 0;
  for (const r of [...rows].sort((a, b) => a.hour - b.hour)) {
    const isFocus = r.commits > 0 && r.meetings === 0 && r.pings === 0;
    run = isFocus ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  let worstHour: number | null = null, worstScore = -1;
  for (const r of rows) {
    const sources = (r.commits > 0 ? 1 : 0) + (r.meetings > 0 ? 1 : 0) + (r.pings > 0 ? 1 : 0);
    const s = sources * 100 + (r.commits + r.meetings + r.pings);
    if (sources >= 2 && s > worstScore) { worstScore = s; worstHour = r.hour; }
  }

  const raw = CONFIG.base + focusHours * CONFIG.focusBonus - switches * CONFIG.switchPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score, switches, focusHours,
    longestBlockMins: longest * 60,
    taxMinutes: switches * CONFIG.refocusTaxMins,
    worstHour,
  };
}