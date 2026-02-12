-- Sync remote database to match local database
-- This ensures both databases have the same users

-- Delete all non-admin users from remote
DELETE FROM users WHERE email != 'admin@eclassroom.com';

-- Insert all users from local database with correct password hashes
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES 
  ('acap', 'asyraafbinsamson@gmail.com', '$2b$10$Aq/oVfRiVeUJp3ALuV63Z.yXDOjVe1q/jkI4xT39VBdOgQyR9lav.', '', 'user'),
  ('teacher1', 'teacher1@eclassroom.com', '$2b$10$62gPbvbh4tkOKM3PedGdBOPU3Gn/4bIv6H9WV4G4MBe/7clod1xze', 'John Teacher', 'user'),
  ('teacher2', 'teacher2@eclassroom.com', '$2b$10$62gPbvbh4tkOKM3PedGdBOPU3Gn/4bIv6H9WV4G4MBe/7clod1xze', 'Sarah Teacher', 'user'),
  ('student1', 'student1@eclassroom.com', '$2b$10$62gPbvbh4tkOKM3PedGdBOPU3Gn/4bIv6H9WV4G4MBe/7clod1xze', 'Mike Student', 'user');
