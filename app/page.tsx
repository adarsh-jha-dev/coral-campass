"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

type HourRow = { hour: number; commits: number; meetings: number; pings: number };
type Stats = {
  score: number; switches: number; focusHours: number;
  longestBlockMins: number; taxMinutes: number; worstHour: number | null;
};
type DayData = { rows: HourRow[]; stats: Stats; insight: string; source: string };

function hourLabel(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}

const isFocus = (r: HourRow) => r.commits > 0 && r.meetings === 0 && r.pings === 0;

export default function Page() {
  const [data, setData] = useState<DayData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/day")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="wrap"><div className="loading">⚠ {err}</div></div>;
  if (!data) return <div className="wrap"><div className="loading">⚓ Hauling in your day…</div></div>;

  const { rows, stats, insight, source } = data;
  const ringCirc = 2 * Math.PI * 58;
  const ringOffset = ringCirc * (1 - stats.score / 100);
  const fromChat = rows.reduce((a, r) => a + r.pings, 0);
  const fromMeet = rows.reduce((a, r) => a + r.meetings, 0);
  const chatPct = fromChat + fromMeet > 0 ? Math.round((fromChat / (fromChat + fromMeet)) * 100) : 0;

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <div className="mark">
            <Clock size={24} />
          </div>
          <div>
            <h1>Coral Compass</h1>
            <div className="sub">CONTEXT&nbsp;SWITCH&nbsp;TAX&nbsp;TRACKER</div>
          </div>
        </div>
        <div className="pill"><span className="dot" /> {source === "mock" ? "demo data" : "3 sources joined · live"}</div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">▲ Today</div>
          <h2>Your deep work got <em>shredded</em> {stats.switches} times today.</h2>
          <p>Coral Compass joins your commits, calendar, and chat onto one timeline — then measures what fragmentation actually costs you.</p>
        </div>
        <div className="gauge-card">
          <div className="gauge-label">Today's Focus Score</div>
          <div className="gauge-ring">
            <div className="ring">
              <svg width="132" height="132" viewBox="0 0 132 132">
                <circle cx="66" cy="66" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
                <circle cx="66" cy="66" r="58" fill="none" stroke="url(#g)" strokeWidth="11"
                  strokeLinecap="round" strokeDasharray={ringCirc} strokeDashoffset={ringOffset} />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ff6b5d" />
                    <stop offset="1" stopColor="#f4c95d" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="ring-val"><b>{stats.score}</b><span>/ 100</span></div>
            </div>
            <div className="gauge-stats">
              <div className="gstat"><div className="n bad">{stats.switches}</div><div className="l">context switches</div></div>
              <div className="gstat"><div className="n good">{stats.longestBlockMins}m</div><div className="l">longest focus block</div></div>
              <div className="gstat"><div className="n">{stats.taxMinutes}m</div><div className="l">est. refocus tax lost</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="sec-head">
        <h3>The day, stitched together</h3>
        <div className="note">github · gcal · chat — one Coral join</div>
      </div>
      <div className="timeline-card">
        <div className="legend">
          <span><i className="swatch sw-git" /> Commits / PRs</span>
          <span><i className="swatch sw-cal" /> Calendar</span>
          <span><i className="swatch sw-msg" /> Chat interruptions</span>
          <span><i className="swatch sw-focus" /> Protected focus block</span>
        </div>
        {rows.filter((r) => r.commits + r.meetings + r.pings > 0).map((r) => {
          const focus = isFocus(r);
          // simple proportional layout within the hour track
          const total = r.commits + r.meetings + r.pings;
          let offset = 4;
          const segs: { cls: string; w: number; label: string }[] = [];
          if (r.commits) segs.push({ cls: "git", w: (r.commits / total) * 90, label: `${r.commits} commit${r.commits > 1 ? "s" : ""}` });
          if (r.meetings) segs.push({ cls: "cal", w: (r.meetings / total) * 90, label: `${r.meetings} mtg` });
          if (r.pings) segs.push({ cls: "msg", w: (r.pings / total) * 90, label: `${r.pings} ping${r.pings > 1 ? "s" : ""}` });
          return (
            <div className="tl-row" key={r.hour}>
              <div className="tl-hour">{hourLabel(r.hour)}</div>
              <div className={"tl-track" + (focus ? " focus-block" : "")}>
                {segs.map((s, i) => {
                  const left = offset; offset += s.w + 2;
                  return <div key={i} className={"ev " + s.cls} style={{ left: `${left}%`, width: `${s.w}%` }}>{s.label}</div>;
                })}
                {focus && <div className="focus-tag">✓ focus</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sec-head">
        <h3>What the agent found in the join</h3>
        <div className="note">reasoning over cross-source rows</div>
      </div>
      <div className="insights">
        <div className="insight-main">
          <div className="ai-badge">✦ {process.env.NEXT_PUBLIC_LLM_LABEL || "AI"}-generated insight</div>
          <p>{insight}</p>
        </div>
        <div className="side-col">
          <div className="mini">
            <div className="k">Worst hour</div>
            <div className="v coral">{stats.worstHour !== null ? hourLabel(stats.worstHour) : "—"}</div>
            <div className="d">most sources colliding in one hour</div>
          </div>
          <div className="mini">
            <div className="k">Interruption source</div>
            <div className="v gold">{chatPct}%</div>
            <div className="d">of breaks came from chat, not meetings</div>
          </div>
          <div className="mini">
            <div className="k">Refocus tax</div>
            <div className="v">{stats.taxMinutes}m</div>
            <div className="d">est. lost to cold-starts (~15m × switches)</div>
          </div>
        </div>
      </div>

      <footer>
        <p>🪸 Built on <span className="built">Coral</span> · query layer for agents</p>
        <p>Pirates of the Coral-bean · Track 2</p>
      </footer>
    </div>
  );
}
