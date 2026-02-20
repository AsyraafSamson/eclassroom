DELETE FROM bookings;
DELETE FROM classrooms;
DELETE FROM users;
DELETE FROM room_groups;
DELETE FROM time_slots;
DELETE FROM school_info;
DELETE FROM sessions;
DELETE FROM departments;
DELETE FROM equipment;
DELETE FROM holidays;
DELETE FROM disabled_periods;
DELETE FROM timetable_weeks;
DELETE FROM password_reset_attempts;

INSERT INTO school_info (id, site_title, school_name, website, logo, login_message, created_at, updated_at) VALUES (1, 'eClassroom', 'My School', NULL, NULL, NULL, '2026-02-12 01:59:36', '2026-02-13 13:37:27');

INSERT INTO room_groups (id, name, description, created_at) VALUES (1, 'General', 'Default room group', '2026-02-12 01:59:36');

INSERT INTO time_slots (id, label, start_time, end_time, created_at) VALUES
(1, 'Slot 1', '08:00', '09:00', '2026-02-12 01:59:36'),
(2, 'Slot 2', '09:00', '10:00', '2026-02-12 01:59:36'),
(3, 'Slot 3', '10:00', '11:00', '2026-02-12 01:59:36'),
(4, 'Slot 4', '11:00', '12:00', '2026-02-12 01:59:36'),
(5, 'Slot 5', '12:00', '13:00', '2026-02-12 01:59:36'),
(6, 'Slot 6', '13:00', '14:00', '2026-02-12 01:59:36'),
(7, 'Slot 7', '14:00', '15:00', '2026-02-12 01:59:36'),
(8, 'Slot 8', '15:00', '16:00', '2026-02-12 01:59:36'),
(9, 'Slot 9', '16:00', '17:00', '2026-02-12 01:59:36');

INSERT INTO users (id, username, email, password_hash, full_name, role, department_id, last_login, reset_token, token_expiry, created_at, updated_at, must_change_password) VALUES
(1, 'admin', 'admin@eclassroom.com', '$2b$10$dFWZyAd9TdJ9xLPc6NSViePwvVZ1ut.b8x/k1XhdebFeFye1YT/ES', 'Administrator', 'admin', NULL, '2026-02-13 13:36:32', NULL, NULL, '2026-02-12 01:59:36', '2026-02-12 01:59:36', 0),
(9, 'Asyraaf', 'asyraafbinsamson@gmail.com', '$2b$10$xFvJwNUcLkxFCbh5tncWJeb68U/NQ/AyqbZeEDEWS5TVJj9ktePgC', '', 'user', NULL, '2026-02-13 13:21:58', NULL, NULL, '2026-02-13 07:24:49', '2026-02-13 08:09:55', 0),
(10, 'iqmal', 'Khairuliqmalruslan@gmail.com', '$2b$10$/I3CHe0goam9Ct4onWLhoudX9OqDHEfdy43.HwMs0RzygzlRDQUrC', '', 'user', NULL, '2026-02-13 08:20:11', NULL, NULL, '2026-02-13 07:45:48', '2026-02-13 07:45:48', 0),
(11, 'haikal', 'manfdvcl9@gmail.com', '$2b$10$G9dX4S16xvdU4l1jFtgCSeO3JFBl9p24P3qFCqvkRWuUGIqcjlPUa', '', 'admin', NULL, '2026-02-13 07:59:56', NULL, NULL, '2026-02-13 07:57:16', '2026-02-13 07:59:08', 0);

INSERT INTO classrooms (id, name, group_id, location, capacity, description, notes, photo, can_be_booked, teacher_id, status, created_at, updated_at) VALUES
(2, 'makmal 1', 1, NULL, NULL, NULL, NULL, NULL, 1, NULL, 'available', '2026-02-13 08:04:19', '2026-02-13 08:04:19'),
(3, 'makmal 2', 1, NULL, NULL, NULL, NULL, NULL, 1, NULL, 'available', '2026-02-13 08:24:47', '2026-02-13 08:24:47');

INSERT INTO bookings (id, user_id, classroom_id, time_slot_id, session_id, booking_date, teacher_name, purpose, status, created_at, updated_at) VALUES
(1, 9, 2, 2, NULL, '2026-02-13', 'test subject', NULL, 'pending', '2026-02-13 08:10:44', '2026-02-13 08:10:44'),
(2, 10, 2, 3, NULL, '2026-02-13', 'Sir Asyraaf', NULL, 'pending', '2026-02-13 08:14:29', '2026-02-13 08:14:29');
