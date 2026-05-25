WITH hours AS (
  SELECT generate_series(0, 23) AS hour
),
git AS (
  SELECT EXTRACT(HOUR FROM authored_at) AS hour, COUNT(*) AS commits
  FROM github.commits
  WHERE authored_at::date = CURRENT_DATE
  GROUP BY 1
),
cal AS (
  SELECT EXTRACT(HOUR FROM start_time) AS hour, COUNT(*) AS meetings
  FROM gcal.events
  WHERE start_time::date = CURRENT_DATE
  GROUP BY 1
),
chat AS (
  SELECT hour, COUNT(*) AS pings FROM (
    SELECT EXTRACT(HOUR FROM sent_at) AS hour
    FROM discord.messages
    WHERE sent_at::date = CURRENT_DATE AND is_mention = true
    UNION ALL
    SELECT EXTRACT(HOUR FROM ts) AS hour
    FROM slack.messages
    WHERE ts::date = CURRENT_DATE AND mentions_me = true
  ) m
  GROUP BY hour
)
SELECT
  h.hour,
  COALESCE(git.commits, 0)  AS commits,
  COALESCE(cal.meetings, 0) AS meetings,
  COALESCE(chat.pings, 0)   AS pings
FROM hours h
LEFT JOIN git  ON git.hour  = h.hour
LEFT JOIN cal  ON cal.hour  = h.hour
LEFT JOIN chat ON chat.hour = h.hour
ORDER BY h.hour;
