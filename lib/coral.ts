// lib/coral.ts
// Thin wrapper around Coral. Two ways to talk to Coral: the CLI (shown here, simplest
// to start) or over MCP. Start with the CLI to get unblocked, switch to MCP if you want
// the agent to drive queries dynamically.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import type { HourRow } from "./focusScore";

const exec = promisify(execFile);

/**
 * Runs a SQL file through the Coral CLI and returns parsed JSON rows.
 * Assumes `coral query --format json` exists; check `coral query --help`
 * for the exact flag on the version you install, and adjust.
 */
export async function runCoralQuery<T = unknown>(sqlPath: string): Promise<T[]> {
  const sql = await readFile(sqlPath, "utf8");
  const { stdout } = await exec("coral", ["query", sql, "--format", "json"], {
    maxBuffer: 1024 * 1024 * 16,
  });
  return JSON.parse(stdout) as T[];
}

/** Convenience: run the day query and coerce into typed HourRows. */
export async function fetchDay(sqlPath = "coral-query.sql"): Promise<HourRow[]> {
  const raw = await runCoralQuery<Record<string, unknown>>(sqlPath);
  return raw.map((r) => ({
    hour: Number(r.hour),
    commits: Number(r.commits ?? 0),
    meetings: Number(r.meetings ?? 0),
    pings: Number(r.pings ?? 0),
  }));
}

// ---- MCP alternative (sketch) ----
// If you wire Coral over MCP instead, your agent/route would call the Coral MCP
// server's query tool with the SQL string and parse the tool_result block.
// Keep the CLI path as a fallback for the demo — it's the most reliable.
