-- ============================================================================
-- eClassroom: Full schema — EzyBook parity for Cloudflare D1 (SQLite)
-- Note: updated_at is managed by application code (D1 trigger limitation)
-- ============================================================================

-- 1. school_info — single-row site configuration
CREATE TABLE IF NOT EXISTS school_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_title TEXT NOT NULL DEFAULT 'eClassroom',
  school_name TEXT NOT NULL DEFAULT 'My School',
  website TEXT,
  logo TEXT,
  login_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO school_info (id, site_title, school_name) VALUES (1, 'eClassroom', 'My School');

-- 2. departments
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. users — expanded with username, department, password reset
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  last_login TEXT,
  reset_token TEXT,
  token_expiry TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Default admin (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@eclassroom.com', '$2b$10$dFWZyAd9TdJ9xLPc6NSViePwvVZ1ut.b8x/k1XhdebFeFye1YT/ES', 'Administrator', 'admin');

-- 4. room_groups
CREATE TABLE IF NOT EXISTS room_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO room_groups (name, description) VALUES ('General', 'Default room group');

-- 5. classrooms — expanded with group, photo, bookable flag, teacher
CREATE TABLE IF NOT EXISTS classrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  group_id INTEGER REFERENCES room_groups(id) ON DELETE SET NULL,
  location TEXT,
  capacity INTEGER,
  description TEXT,
  notes TEXT,
  photo TEXT,
  can_be_booked INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_classrooms_status ON classrooms(status);
CREATE INDEX IF NOT EXISTS idx_classrooms_name ON classrooms(name);
CREATE INDEX IF NOT EXISTS idx_classrooms_group ON classrooms(group_id);

-- 6. equipment
CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  classroom_id INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_equipment_classroom ON equipment(classroom_id);

-- 7. sessions — academic terms
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_dates ON sessions(start_date, end_date);

-- 8. timetable_weeks
CREATE TABLE IF NOT EXISTS timetable_weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_timetable_weeks_session ON timetable_weeks(session_id);

-- 9. time_slots
CREATE TABLE IF NOT EXISTS time_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(label, start_time, end_time)
);

INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 1', '08:00', '09:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 2', '09:00', '10:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 3', '10:00', '11:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 4', '11:00', '12:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 5', '12:00', '13:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 6', '13:00', '14:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 7', '14:00', '15:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 8', '15:00', '16:00');
INSERT INTO time_slots (label, start_time, end_time) VALUES ('Slot 9', '16:00', '17:00');

-- 10. holidays
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  holiday_name TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  year INTEGER,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_holidays_session ON holidays(session_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- 11. disabled_periods
CREATE TABLE IF NOT EXISTS disabled_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('day', 'week', 'month')),
  period_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_disabled_periods_session ON disabled_periods(session_id);

-- 12. bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  time_slot_id INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  booking_date TEXT NOT NULL,
  teacher_name TEXT,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_classroom ON bookings(classroom_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_unique ON bookings(classroom_id, booking_date, time_slot_id);

-- 13. password_reset_attempts — rate limiting
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_reset_ip ON password_reset_attempts(ip, created_at);
