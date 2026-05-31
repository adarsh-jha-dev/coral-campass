# Coral Compass

> Context switch tax tracker. Joins your commits, calendar, and chat onto one timeline — then measures what fragmentation actually costs you.

Built on [Coral](https://withcoral.com/) for *Pirates of the Coral-bean* hackathon

## What it does

Most "focus" tools watch one signal. Coral Compass joins three:

- **GitHub** — commits and PRs as a proxy for deep work
- **Google Calendar** — meetings as scheduled fragmentation
- **Slack / Discord** — pings and mentions as unscheduled fragmentation

It buckets the day by hour, scores it 0–100, and asks an LLM to name the pattern it sees in the data.

## How it works

```
sources ──► Coral SQL join ──► focus score ──► LLM insight
```

1. **Sources.** GitHub, GCal, and chat are pulled via Coral data sources (one of which — Discord — is in this repo under `coral/sources/discord/`).
2. **Join.** A single SQL query in `coral-query.sql` stitches them into hourly rows: `{ hour, commits, meetings, pings }`.
3. **Score.** `lib/focusScore.ts` computes context switches, refocus tax (≈15 min per switch), and the longest uninterrupted block.
4. **Insight.** `lib/llm.ts` sends the rows + stats to either Gemini or Anthropic (toggle via `LLM_PROVIDER`) and parses a structured JSON response.

## Run it

```bash
pnpm install
cp .env.local.example .env.local   # fill in keys, or leave USE_MOCK=true
pnpm dev
```

Set `USE_MOCK=true` to see the dashboard with seeded data — no credentials needed.

## Stack

Next.js · TypeScript · Coral · Gemini / Anthropic · Google Calendar API · Discord API

## Status

Hackathon build. The mock-data path is solid; the live Coral join works end-to-end on GitHub + chat. GCal is wired but rough around timezone edges. Treat it as a prototype.

---

Adarsh Jha · May 2026