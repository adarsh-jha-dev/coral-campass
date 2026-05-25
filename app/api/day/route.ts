import { NextResponse } from "next/server";
import { fetchDay } from "@/lib/coral";
import { focusScore } from "@/lib/focusScore";
import { diagnose } from "@/lib/llm";
import { MOCK_DAY } from "@/lib/mockDay";

const USE_MOCK = process.env.USE_MOCK;

export async function GET() {
  try {
    const rows = USE_MOCK ? MOCK_DAY : await fetchDay();

    const stats = focusScore(rows);

    const insight = await diagnose(rows, stats);

    return NextResponse.json({ rows, stats, insight, source: USE_MOCK ? "mock" : "coral" });
  } catch (err) {
    console.error("[/api/day]", err);
    return NextResponse.json(
      { error: "Failed to assemble the day. Is Coral running and configured?" },
      { status: 500 }
    );
  }
}
