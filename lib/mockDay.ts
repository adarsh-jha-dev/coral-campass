import type { HourRow } from "./focusScore";

export const MOCK_DAY: HourRow[] = [
  { hour: 8, commits: 1, meetings: 0, pings: 0 },
  { hour: 9, commits: 4, meetings: 0, pings: 0 }, // the one real focus block
  { hour: 10, commits: 1, meetings: 1, pings: 0 },
  { hour: 11, commits: 1, meetings: 0, pings: 2 },
  { hour: 12, commits: 0, meetings: 1, pings: 0 },
  { hour: 13, commits: 1, meetings: 1, pings: 1 },
  { hour: 14, commits: 2, meetings: 0, pings: 3 }, // worst hour
  { hour: 15, commits: 1, meetings: 1, pings: 0 },
  { hour: 16, commits: 3, meetings: 0, pings: 1 },
  { hour: 17, commits: 1, meetings: 1, pings: 1 },
  { hour: 18, commits: 1, meetings: 0, pings: 0 },
];
