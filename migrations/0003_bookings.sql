-- Time slots
CREATE TABLE IF NOT EXISTS time_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(label, start_time, end_time)
);

INSERT OR IGNORE INTO time_slots (label, start_time, end_time) VALUES
  ('Morning Slot 1', '08:00', '10:00'),
  ('Morning Slot 2', '10:00', '12:00'),
  ('Afternoon Slot 1', '13:00', '15:00'),
  ('Afternoon Slot 2', '15:00', '17:00');

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  classroom_id INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  time_slot_id INTEGER NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_classroom_slot ON bookings(classroom_id, booking_date, time_slot_id);

CREATE TRIGGER IF NOT EXISTS trg_bookings_updated_at
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  UPDATE bookings SET updated_at = datetime('now') WHERE id = OLD.id;
END;
