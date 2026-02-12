-- Add sample users for testing
-- Password for all users: user123

-- First delete any existing sample users
DELETE FROM users WHERE email IN ('teacher1@eclassroom.com', 'teacher2@eclassroom.com', 'student1@eclassroom.com');

-- Insert with correct password hash
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES 
  ('teacher1', 'teacher1@eclassroom.com', '$2b$10$62gPbvbh4tkOKM3PedGdBOPU3Gn/4bIv6H9WV4G4MBe/7clod1xze', 'John Teacher', 'user'),
  ('teacher2', 'teacher2@eclassroom.com', '$2b$10$62gPbvbh4tkOKM3PedGdBOPU3Gn/4bIv6H9WV4G4MBe/7clod1xze', 'Sarah Teacher', 'user'),
  ('student1', 'student1@eclassroom.com', '$2b$10$62gPbvbh4tkOKM3PedGdBOPU3Gn/4bIv6H9WV4G4MBe/7clod1xze', 'Mike Student', 'user');
