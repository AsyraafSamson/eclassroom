-- Add must_change_password flag to users table for first-login password enforcement

ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1));
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON users(must_change_password);
