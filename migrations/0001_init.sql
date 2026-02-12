-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create default admin user (password: admin123)
-- bcrypt hash for 'admin123'
INSERT OR IGNORE INTO users (email, password_hash, full_name, role)
VALUES ('admin@eclassroom.com', '$2b$10$dFWZyAd9TdJ9xLPc6NSViePwvVZ1ut.b8x/k1XhdebFeFye1YT/ES', 'Admin', 'admin');
