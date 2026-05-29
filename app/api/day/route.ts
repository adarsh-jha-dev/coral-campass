import { NextResponse } from "next/server";
import { fetchDay } from "@/lib/coral";
import { focusScore } from "@/lib/focusScore";
import { diagnose } from "@/lib/llm";
import { MOCK_DAY } from "@/lib/mockDay";
import { gcalMeetingsByHour } from "@/lib/sources/gcal";

const USE_MOCK = process.env.USE_MOCK;

export async function GET() {
  try {
    const rows = USE_MOCK === "true" ? MOCK_DAY : await fetchDay();

    if (USE_MOCK === "false") {
      try {
        const meetingsByHour = await gcalMeetingsByHour();
        console.log("[gcal] meetings by hour:", meetingsByHour);
        for (const r of rows) {
          r.meetings = meetingsByHour[r.hour] ?? 0;
        }
      } catch (err) {
        console.error("[gcal]", err);
      }
    }

    const stats = focusScore(rows);

    const insight = await diagnose(rows, stats);

    return NextResponse.json({
      rows,
      stats,
      insight,
      source: USE_MOCK === "true" ? "mock" : "coral",
    });
  } catch (err) {
    console.error("[/api/day]", err);
    return NextResponse.json(
      { error: "Failed to assemble the day. Is Coral running and configured?" },
      { status: 500 },
    );
  }
}
