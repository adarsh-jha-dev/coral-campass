// lib/sources/gcal.ts — direct Google Calendar fetcher
// Pulls today's events for the primary calendar, buckets by IST hour.

import { google } from "googleapis";

export async function gcalMeetingsByHour(date?: string): Promise<Record<number, number>> {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const cal = google.calendar({ version: "v3", auth: oauth2 });

  // Default: today in IST, expressed as RFC3339 bounds.
  const day = date ? new Date(date + "T00:00:00+05:30") : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  const byHour: Record<number, number> = {};
  for (const ev of res.data.items ?? []) {
    const startTime = ev.start?.dateTime; // skip all-day events (no time)
    if (!startTime) continue;
    const d = new Date(startTime);
    const istHour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric", hour12: false, timeZone: "Asia/Kolkata"
      }).format(d)
    );
    byHour[istHour] = (byHour[istHour] ?? 0) + 1;
  }
  return byHour;
}