import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import type { HourRow, FocusResult } from "./focusScore";

type Provider = "gemini" | "anthropic";
const PROVIDER = (process.env.LLM_PROVIDER as Provider) || "gemini";

export type Insight = { headline: string; detail: string; recommendation: string };

function buildPrompt(rows: HourRow[], stats: FocusResult): string {
  return `You are a focus coach analyzing a developer's day, bucketed by hour and joined
across GitHub commits and Slack chat pings (an interruption signal).

DATA: ${JSON.stringify(rows)}
STATS: score ${stats.score}/100, ${stats.switches} context switches, longest focus block
${stats.longestBlockMins}min, refocus tax ${stats.taxMinutes}min, worst hour ${stats.worstHour ?? "n/a"}:00.

Respond ONLY with JSON (no markdown, no prose) in exactly this shape:
{"headline":"one punchy sentence naming the day's core pattern, reference a specific hour",
 "detail":"2-3 sentences on the worst fragmentation stretch and its likely cause from the data",
 "recommendation":"one concrete, specific action"}
Do not invent data not present above. If the day is light, say so honestly. Be direct and warm.`;
}

function parseInsight(raw: string, stats: FocusResult): Insight {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const o = JSON.parse(clean);
    if (o.headline && o.detail && o.recommendation) return o as Insight;
  } catch { /* fall through */ }
  return {
    headline: `Focus score ${stats.score}/100 with ${stats.switches} context switches.`,
    detail: `Your longest uninterrupted block was ${stats.longestBlockMins} minutes.` +
      (stats.worstHour !== null ? ` Hour ${stats.worstHour}:00 was your most fragmented.` : " A light day overall."),
    recommendation: "Defend your longest focus window tomorrow — block it on the calendar.",
  };
}

async function viaGemini(p: string): Promise<string> {
  const g = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = g.getGenerativeModel({ model: "gemini-2.5-flash" });
  return (await model.generateContent(p)).response.text();
}

async function viaAnthropic(p: string): Promise<string> {
  const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const m = await c.messages.create({
    model: "claude-3-5-haiku-20241022", max_tokens: 400,
    messages: [{ role: "user", content: p }],
  });
  const b = m.content.find(x => x.type === "text");
  return b && "text" in b ? b.text : "";
}

export async function diagnose(rows: HourRow[], stats: FocusResult): Promise<Insight> {
  const p = buildPrompt(rows, stats);
  try {
    const raw = PROVIDER === "anthropic" ? await viaAnthropic(p) : await viaGemini(p);
    return parseInsight(raw, stats);
  } catch (err) {
    console.error(`[llm:${PROVIDER}]`, err);
    return parseInsight("", stats);
  }
}