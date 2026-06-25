-- ============================================================
-- EDUCORE - Seed Data
-- Creates demo school with sample data for testing
-- Run AFTER the main schema migration
-- ============================================================

-- Demo School
INSERT INTO schools (
  id, name, code, email, phone, address, city, region, country,
  status, subscription_plan, max_students, max_teachers,
  settings
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'EduCore Demo Academy',
  'EDA',
  'admin@demo.educore.app',
  '0302-000-000',
  '1 Education Avenue, East Legon',
  'Accra',
  'Greater Accra',
  'Ghana',
  'active',
  'pro',
  1000,
  100,
  '{
    "grading_system": "percentage",
    "academic_year_start_month": 9,
    "terms_per_year": 3,
    "attendance_method": "both",
    "currency": "GHS",
    "currency_symbol": "₵",
    "timezone": "Africa/Accra",
    "language": "en",
    "sms_enabled": false,
    "email_notifications": true,
    "parent_portal_enabled": true,
    "student_portal_enabled": true
  }'
) ON CONFLICT DO NOTHING;

-- Grading Scale for Demo School
INSERT INTO grading_scales (school_id, name, is_default, grades) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Ghana Standard (WAEC)',
  true,
  '[
    {"grade": "A1", "min_percentage": 80, "max_percentage": 100, "grade_points": 4.0, "description": "Excellent"},
    {"grade": "B2", "min_percentage": 70, "max_percentage": 79, "grade_points": 3.5, "description": "Very Good"},
    {"grade": "B3", "min_percentage": 65, "max_percentage": 69, "grade_points": 3.0, "description": "Good"},
    {"grade": "C4", "min_percentage": 60, "max_percentage": 64, "grade_points": 2.5, "description": "Credit"},
    {"grade": "C5", "min_percentage": 55, "max_percentage": 59, "grade_points": 2.0, "description": "Credit"},
    {"grade": "C6", "min_percentage": 50, "max_percentage": 54, "grade_points": 1.5, "description": "Credit"},
    {"grade": "D7", "min_percentage": 45, "max_percentage": 49, "grade_points": 1.0, "description": "Pass"},
    {"grade": "E8", "min_percentage": 40, "max_percentage": 44, "grade_points": 0.5, "description": "Pass"},
    {"grade": "F9", "min_percentage": 0, "max_percentage": 39, "grade_points": 0.0, "description": "Fail"}
  ]'
) ON CONFLICT DO NOTHING;

-- Academic Year
INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '2024/2025',
  '2024-09-01',
  '2025-07-31',
  true
) ON CONFLICT DO NOTHING;

-- Terms
INSERT INTO terms (id, school_id, academic_year_id, name, term_type, start_date, end_date, is_current) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'First Term', 'first', '2024-09-09', '2024-12-13', false),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Second Term', 'second', '2025-01-13', '2025-04-11', true),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Third Term', 'third', '2025-05-05', '2025-07-25', false)
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (id, school_id, name, code) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mathematics & Sciences', 'MATHS'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Languages & Humanities', 'LANG'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Technical & Vocational', 'TECH'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Social Studies', 'SOC')
ON CONFLICT DO NOTHING;

-- Subjects
INSERT INTO subjects (id, school_id, department_id, name, code) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Mathematics', 'MATH'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Integrated Science', 'SCI'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'English Language', 'ENG'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'French', 'FRE'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Social Studies', 'SOC'),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'History', 'HIS'),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'ICT', 'ICT'),
  ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Physics', 'PHY')
ON CONFLICT DO NOTHING;

-- Classes
INSERT INTO classes (id, school_id, academic_year_id, name, level, section, capacity) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JHS 1', 7, 'A', 40),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JHS 1', 7, 'B', 40),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JHS 2', 8, 'A', 40),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JHS 2', 8, 'B', 40),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JHS 3', 9, 'A', 40),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JHS 3', 9, 'B', 35),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'SHS 1', 10, 'Science', 40),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'SHS 2', 11, 'Business', 38)
ON CONFLICT DO NOTHING;

-- Fee Categories
INSERT INTO fee_categories (id, school_id, name, description, is_mandatory) VALUES
  ('g0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tuition Fee', 'Core academic fees', true),
  ('g0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Feeding Fee', 'Meals and refreshments', true),
  ('g0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Hostel Fee', 'Accommodation charges', false),
  ('g0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sports Fee', 'Sports and extracurricular', true),
  ('g0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'PTA Levy', 'Parent-Teacher Association levy', true),
  ('g0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Examination Fee', 'BECE/WASSCE registration', false)
ON CONFLICT DO NOTHING;

-- Exam Types
INSERT INTO exam_types (id, school_id, name, weight) VALUES
  ('h0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Class Score', 30),
  ('h0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'End of Term Exam', 70),
  ('h0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mock Examination', 100),
  ('h0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Mid-Term Test', 40)
ON CONFLICT DO NOTHING;

-- Hostel Blocks
INSERT INTO hostel_blocks (id, school_id, name, gender, floors) VALUES
  ('i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Block A — Boys', 'male', 2),
  ('i0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Block B — Girls', 'female', 2)
ON CONFLICT DO NOTHING;

-- Hostel Rooms
INSERT INTO hostel_rooms (id, school_id, block_id, room_number, room_type, capacity, floor) VALUES
  ('j0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', '101', 'dormitory', 8, 1),
  ('j0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', '102', 'dormitory', 8, 1),
  ('j0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000002', '201', 'dormitory', 8, 2),
  ('j0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000002', '202', 'dormitory', 8, 2)
ON CONFLICT DO NOTHING;

-- Note: Auth users + profiles must be created via Supabase Dashboard or Admin API
-- because passwords need to be hashed by Supabase Auth.
-- Use: Authentication → Add User in Supabase dashboard

-- After creating users, run:
-- UPDATE profiles SET role = 'school_admin', school_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'admin@demo.educore.app';
-- UPDATE profiles SET role = 'teacher', school_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'teacher@demo.educore.app';
