CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience TEXT NOT NULL CHECK (audience IN ('beta', 'operator')),
  email TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_audience_submitted_at
  ON leads (audience, submitted_at);

CREATE TABLE IF NOT EXISTS submission_rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS submission_rate_limits_window_start
  ON submission_rate_limits (window_start);
