-- Migration: Port EzyBook equipment model (form field definitions with types)
-- Equipment becomes a form field definition with type (CHECKBOX/TEXT/SELECT) and options
-- Classroom-equipment assignment moves to a junction table

-- Step 1: Create new equipment table with type/options columns
CREATE TABLE IF NOT EXISTS equipment_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'CHECKBOX',
  options TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Migrate existing data (description and classroom_id are dropped)
INSERT INTO equipment_new (id, name, type, options, created_at, updated_at)
SELECT id, name, 'CHECKBOX', NULL, created_at, updated_at
FROM equipment;

-- Step 3: Drop old table and rename
DROP TABLE IF EXISTS equipment;
ALTER TABLE equipment_new RENAME TO equipment;

-- Step 4: Create classroom_equipment junction table
CREATE TABLE IF NOT EXISTS classroom_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  value TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 5: Indexes
CREATE INDEX IF NOT EXISTS idx_classroom_equipment_classroom ON classroom_equipment(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_equipment_equipment ON classroom_equipment(equipment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_equipment_unique ON classroom_equipment(classroom_id, equipment_id);
