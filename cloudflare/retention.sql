-- Run at least monthly in the production D1 SQL console (and separately for previews).
DELETE FROM leads
WHERE submitted_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 months');

DELETE FROM submission_rate_limits
WHERE window_start < (unixepoch('now', '-24 hours') * 1000);
