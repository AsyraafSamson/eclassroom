-- Room groups
CREATE TABLE IF NOT EXISTS room_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO room_groups (name) VALUES ('General');

-- Add group_id to classrooms
ALTER TABLE classrooms ADD COLUMN group_id INTEGER;

UPDATE classrooms
SET group_id = (SELECT id FROM room_groups WHERE name = 'General')
WHERE group_id IS NULL;

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO sessions (id, name, start_date, end_date)
VALUES (1, '2026 Session', '2026-01-01', '2026-12-31');
