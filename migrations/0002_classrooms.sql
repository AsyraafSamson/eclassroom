-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_status ON classrooms(status);
CREATE INDEX IF NOT EXISTS idx_classrooms_name ON classrooms(name);

-- Trigger to auto-update updated_at
CREATE TRIGGER IF NOT EXISTS trg_classrooms_updated_at
AFTER UPDATE ON classrooms
FOR EACH ROW
BEGIN
  UPDATE classrooms SET updated_at = datetime('now') WHERE id = OLD.id;
END;
