import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import type { HourRow, FocusResult } from "./focusScore";

type Provider = "gemini" | "anthropic";
const PROVIDER = (process.env.LLM_PROVIDER as Provider) || "gemini";

function buildPrompt(rows: HourRow[], stats: FocusResult): string {
  return `You are a focus coach. Here is a developer's day, bucketed by hour,
joined across GitHub commits, calendar meetings, and chat pings:

${JSON.stringify(rows)}

Computed stats: focus score ${stats.score}/100, ${stats.switches} context switches,
longest focus block ${stats.longestBlockMins} min, estimated refocus tax ${stats.taxMinutes} min,
worst hour: ${stats.worstHour ?? "n/a"}:00.

In 3-4 sentences: identify the single worst stretch of fragmentation, name the likely
cause from the data, and give ONE concrete, specific recommendation. Be direct and warm.
Reference specific hours. Do not invent data not present above.`;
}

async function viaGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function viaAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-3-5-haiku-20241022", 
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text : "No insight generated.";
}

export async function diagnose(
  rows: HourRow[],
  stats: FocusResult
): Promise<string> {
  const prompt = buildPrompt(rows, stats);
  try {
    return PROVIDER === "anthropic"
      ? await viaAnthropic(prompt)
      : await viaGemini(prompt);
  } catch (err) {
    console.error(`[llm:${PROVIDER}]`, err);
    return `Your focus score today is ${stats.score}/100 with ${stats.switches} context switches. ` +
      `Your longest uninterrupted block was ${stats.longestBlockMins} minutes. ` +
      (stats.worstHour !== null
        ? `Hour ${stats.worstHour}:00 was your most fragmented — that's where to defend your time.`
        : `Protect your longest block tomorrow.`);
  }
}
