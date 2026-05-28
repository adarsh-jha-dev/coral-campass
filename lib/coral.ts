import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import type { HourRow } from "./focusScore";

const exec = promisify(execFile);

export async function runCoralQuery<T = unknown>(sqlPath: string): Promise<T[]> {
  const sql = await readFile(sqlPath, "utf8");
  const { stdout } = await exec("coral", ["sql", sql, "--format", "json"], {
    maxBuffer: 1024 * 1024 * 16,
  });
  return JSON.parse(stdout) as T[];
}

export async function fetchDay(sqlPath = "coral-query.sql"): Promise<HourRow[]> {
  const raw = await runCoralQuery<Record<string, unknown>>(sqlPath);
  return raw.map((r) => ({
    hour: Number(r.hour),
    commits: Number(r.commits ?? 0),
    meetings: Number(r.meetings ?? 0),
    pings: Number(r.pings ?? 0),
  }));
}
