WITH hours AS (
  SELECT unnest(range(0,24)) AS hour
),
git AS (
  SELECT EXTRACT(HOUR FROM commit__author__date) AS h, COUNT(*) AS commits
  FROM github.commits
  WHERE owner = 'adarsh-jha-dev' AND repo = 'audit-ai'
    AND commit__author__date::date >= CURRENT_DATE - 30
  GROUP BY 1
),
chat AS (
  SELECT EXTRACT(HOUR FROM ts) AS h, COUNT(*) AS pings
  FROM slack.messages(channel => 'C0B5XEGAYG7')
  WHERE ts::date >= CURRENT_DATE - 30
  GROUP BY 1
)
SELECT
  hr.hour,
  COALESCE(git.commits, 0) AS commits,
  0                        AS meetings,
  COALESCE(chat.pings, 0)  AS pings
FROM hours hr
LEFT JOIN git  ON git.h  = hr.hour
LEFT JOIN chat ON chat.h = hr.hour
ORDER BY hr.hour;