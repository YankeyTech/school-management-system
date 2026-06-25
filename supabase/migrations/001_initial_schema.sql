-- ============================================================
-- EDUCORE - Complete Database Schema
-- Version: 1.0.0
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Helper Functions ─────────────────────────────────────────

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate sequential IDs with prefix
CREATE OR REPLACE FUNCTION generate_student_id(school_code TEXT, seq INT)
RETURNS TEXT AS $$
BEGIN
  RETURN school_code || '-STU-' || LPAD(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_teacher_id(school_code TEXT, seq INT)
RETURNS TEXT AS $$
BEGIN
  RETURN school_code || '-TCH-' || LPAD(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number(school_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN school_code || '-INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_receipt_number(school_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN school_code || '-RCT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ─── SCHOOLS ─────────────────────────────────────────────────

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Ghana',
  website TEXT,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  max_students INT NOT NULL DEFAULT 500,
  max_teachers INT NOT NULL DEFAULT 50,
  settings JSONB NOT NULL DEFAULT '{
    "grading_system": "percentage",
    "academic_year_start_month": 9,
    "terms_per_year": 3,
    "attendance_method": "manual",
    "currency": "GHS",
    "currency_symbol": "₵",
    "timezone": "Africa/Accra",
    "language": "en",
    "sms_enabled": false,
    "email_notifications": true,
    "parent_portal_enabled": true,
    "student_portal_enabled": true
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_schools_code ON schools(code);

-- ─── PROFILES ─────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'parent', 'student')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ACADEMIC YEARS ───────────────────────────────────────────

CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE INDEX idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX idx_academic_years_is_current ON academic_years(school_id, is_current);

-- Only one current year per school
CREATE OR REPLACE FUNCTION ensure_single_current_academic_year()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE academic_years 
    SET is_current = false 
    WHERE school_id = NEW.school_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_current_academic_year
  AFTER INSERT OR UPDATE ON academic_years
  FOR EACH ROW WHEN (NEW.is_current = true)
  EXECUTE FUNCTION ensure_single_current_academic_year();

-- ─── TERMS ────────────────────────────────────────────────────

CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  term_type TEXT NOT NULL CHECK (term_type IN ('first', 'second', 'third')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, academic_year_id, term_type)
);

CREATE INDEX idx_terms_school_id ON terms(school_id);
CREATE INDEX idx_terms_academic_year_id ON terms(academic_year_id);

-- ─── DEPARTMENTS ──────────────────────────────────────────────

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  head_teacher_id UUID, -- FK added after teachers table
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, code)
);

CREATE INDEX idx_departments_school_id ON departments(school_id);

-- ─── SUBJECTS ─────────────────────────────────────────────────

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_elective BOOLEAN NOT NULL DEFAULT false,
  credit_hours INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, code)
);

CREATE INDEX idx_subjects_school_id ON subjects(school_id);
CREATE INDEX idx_subjects_department_id ON subjects(department_id);

-- ─── CLASSES ──────────────────────────────────────────────────

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name TEXT NOT NULL,
  level INT NOT NULL,
  section TEXT,
  capacity INT NOT NULL DEFAULT 40,
  class_teacher_id UUID, -- FK added after teachers
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, academic_year_id, name, section)
);

CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_classes_academic_year_id ON classes(academic_year_id);

-- Class-Subject-Teacher mapping
CREATE TABLE class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL, -- FK to teachers.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, subject_id)
);

-- ─── TEACHERS ─────────────────────────────────────────────────

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  other_names TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  nationality TEXT NOT NULL DEFAULT 'Ghanaian',
  
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  
  hire_date DATE NOT NULL,
  department_id UUID REFERENCES departments(id),
  position TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
  
  highest_qualification TEXT NOT NULL,
  qualifications JSONB DEFAULT '[]',
  
  bank_name TEXT,
  bank_account TEXT,
  basic_salary NUMERIC(12, 2),
  
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(school_id, teacher_id),
  UNIQUE(school_id, employee_id)
);

CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_teachers_profile_id ON teachers(profile_id);
CREATE INDEX idx_teachers_department_id ON teachers(department_id);

-- Add FK for departments.head_teacher_id
ALTER TABLE departments ADD CONSTRAINT fk_head_teacher
  FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Add FK for classes.class_teacher_id  
ALTER TABLE classes ADD CONSTRAINT fk_class_teacher
  FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Add FK for class_subjects.teacher_id
ALTER TABLE class_subjects ADD CONSTRAINT fk_class_subject_teacher
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

-- ─── STUDENTS ─────────────────────────────────────────────────

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL,
  admission_number TEXT NOT NULL,
  admission_date DATE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  other_names TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  nationality TEXT NOT NULL DEFAULT 'Ghanaian',
  religion TEXT,
  
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
  allergies TEXT[],
  medical_conditions TEXT[],
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  
  avatar_url TEXT,
  birth_certificate_url TEXT,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_boarding BOOLEAN NOT NULL DEFAULT false,
  hostel_room_id UUID, -- FK to hostel_rooms
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(school_id, student_id),
  UNIQUE(school_id, admission_number)
);

CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_is_active ON students(school_id, is_active);
CREATE INDEX idx_students_name ON students USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- ─── GUARDIANS ────────────────────────────────────────────────

CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'sibling', 'other')),
  email TEXT,
  phone TEXT NOT NULL,
  occupation TEXT,
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  has_portal_access BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardians_student_id ON guardians(student_id);
CREATE INDEX idx_guardians_school_id ON guardians(school_id);

-- ─── ATTENDANCE ───────────────────────────────────────────────

CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  term_id UUID NOT NULL REFERENCES terms(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  date DATE NOT NULL,
  taken_by UUID NOT NULL REFERENCES teachers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, class_id, date, COALESCE(subject_id, uuid_nil()))
);

CREATE INDEX idx_attendance_records_school ON attendance_records(school_id, date);
CREATE INDEX idx_attendance_records_class ON attendance_records(class_id, date);

CREATE TABLE attendance_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  time_in TIMETZ,
  remarks TEXT,
  qr_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attendance_record_id, student_id)
);

CREATE INDEX idx_attendance_entries_student ON attendance_entries(student_id);
CREATE INDEX idx_attendance_entries_record ON attendance_entries(attendance_record_id);

CREATE TABLE teacher_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  time_in TIMETZ,
  time_out TIMETZ,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, teacher_id, date)
);

-- ─── GRADING SCALES ───────────────────────────────────────────

CREATE TABLE grading_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  grades JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Default Ghana grading scale
INSERT INTO grading_scales (school_id, name, is_default, grades)
SELECT 
  id,
  'Ghana Standard',
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
FROM schools WHERE false; -- Template only, populated per school

-- ─── EXAM TYPES ───────────────────────────────────────────────

CREATE TABLE exam_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC(5, 2) NOT NULL DEFAULT 100,
  term_id UUID REFERENCES terms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- ─── EXAMS ────────────────────────────────────────────────────

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  venue TEXT,
  total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100,
  passing_marks NUMERIC(6, 2) NOT NULL DEFAULT 50,
  duration_minutes INT NOT NULL DEFAULT 60,
  
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  instructions TEXT,
  invigilator_id UUID REFERENCES teachers(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_exams_school ON exams(school_id);
CREATE INDEX idx_exams_class ON exams(class_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_date ON exams(start_datetime);

-- ─── EXAM RESULTS ─────────────────────────────────────────────

CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  
  marks_obtained NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_marks NUMERIC(6, 2) NOT NULL,
  percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_marks > 0 THEN (marks_obtained / total_marks) * 100 ELSE 0 END
  ) STORED,
  grade TEXT,
  grade_points NUMERIC(3, 2) DEFAULT 0,
  position INT,
  remarks TEXT,
  ai_comment TEXT,
  teacher_comment TEXT,
  
  is_absent BOOLEAN NOT NULL DEFAULT false,
  entered_by UUID NOT NULL REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE INDEX idx_exam_results_school ON exam_results(school_id);
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_exam_results_exam ON exam_results(exam_id);
CREATE INDEX idx_exam_results_class_term ON exam_results(class_id, term_id);

-- ─── ASSIGNMENTS ──────────────────────────────────────────────

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100,
  due_date TIMESTAMPTZ NOT NULL,
  attachments TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  content TEXT,
  file_urls TEXT[],
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'missing')),
  marks_obtained NUMERIC(6, 2),
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignments_school ON assignments(school_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);

-- ─── TIMETABLE ────────────────────────────────────────────────

CREATE TABLE timetable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent teacher double-booking
  UNIQUE(school_id, teacher_id, term_id, day_of_week, start_time),
  -- Prevent room double-booking
  UNIQUE(school_id, room, term_id, day_of_week, start_time)
);

CREATE INDEX idx_timetable_class ON timetable_slots(class_id, term_id);
CREATE INDEX idx_timetable_teacher ON timetable_slots(teacher_id, term_id);

-- ─── FINANCE ──────────────────────────────────────────────────

CREATE TABLE fee_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  term_id UUID REFERENCES terms(id),
  class_id UUID REFERENCES classes(id),
  fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
  
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  late_fee NUMERIC(12, 2),
  late_fee_type TEXT CHECK (late_fee_type IN ('fixed', 'percentage')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_fee_structures_school ON fee_structures(school_id);
CREATE INDEX idx_fee_structures_academic_year ON fee_structures(academic_year_id);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  discount_reason TEXT,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue', 'waived')),
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoices_school ON invoices(school_id);
CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_term ON invoices(term_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  
  receipt_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'card', 'cheque')),
  
  mobile_money_provider TEXT CHECK (mobile_money_provider IN ('mtn_momo', 'telecel_cash', 'airteltigo')),
  mobile_money_number TEXT,
  transaction_reference TEXT,
  
  notes TEXT,
  received_by UUID NOT NULL REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_school ON payments(school_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Auto-update invoice amount_paid and status
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET 
    amount_paid = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payments 
      WHERE invoice_id = NEW.invoice_id
    ),
    status = CASE
      WHEN amount_paid >= total_amount THEN 'paid'
      WHEN amount_paid > 0 THEN 'partial'
      WHEN due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'unpaid'
    END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_payment_created
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_on_payment();

-- ─── LIBRARY ──────────────────────────────────────────────────

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  year INT,
  edition TEXT,
  subject TEXT,
  category TEXT NOT NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  cover_url TEXT,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_books_school ON books(school_id);
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('english', title || ' ' || author));
CREATE INDEX idx_books_available ON books(school_id, available_copies);

CREATE TABLE book_borrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id),
  borrower_id UUID NOT NULL,
  borrower_type TEXT NOT NULL CHECK (borrower_type IN ('student', 'teacher')),
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue', 'lost')),
  fine_amount NUMERIC(10, 2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_borrows_school ON book_borrows(school_id);
CREATE INDEX idx_borrows_borrower ON book_borrows(borrower_id);
CREATE INDEX idx_borrows_status ON book_borrows(status);

-- ─── HOSTEL ───────────────────────────────────────────────────

CREATE TABLE hostel_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
  floors INT NOT NULL DEFAULT 1,
  warden_id UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE TABLE hostel_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('dormitory', 'private', 'semi_private')),
  capacity INT NOT NULL DEFAULT 4,
  occupied INT NOT NULL DEFAULT 0,
  floor INT NOT NULL DEFAULT 1,
  facilities TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, block_id, room_number)
);

CREATE TABLE hostel_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES hostel_rooms(id),
  student_id UUID NOT NULL REFERENCES students(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  bed_number TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, bed_number, academic_year_id)
);

-- Add FK for students.hostel_room_id
ALTER TABLE students ADD CONSTRAINT fk_student_hostel_room
  FOREIGN KEY (hostel_room_id) REFERENCES hostel_rooms(id) ON DELETE SET NULL;

-- ─── TRANSPORT ────────────────────────────────────────────────

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  capacity INT NOT NULL,
  driver_id UUID REFERENCES teachers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, registration_number)
);

CREATE TABLE transport_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  stops JSONB NOT NULL DEFAULT '[]',
  morning_departure TIME NOT NULL,
  afternoon_departure TIME NOT NULL,
  fee_per_term NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE TABLE student_transport (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  route_id UUID NOT NULL REFERENCES transport_routes(id),
  stop_name TEXT NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, academic_year_id)
);

-- ─── COMMUNICATION ────────────────────────────────────────────

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  target_roles TEXT[] NOT NULL DEFAULT '{"school_admin","teacher","parent","student"}',
  target_classes UUID[],
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_announcements_school ON announcements(school_id, created_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ─── AUDIT LOG ────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_school ON audit_logs(school_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- ─── TIMESTAMPS TRIGGERS ──────────────────────────────────────

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timetable_updated_at BEFORE UPDATE ON timetable_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_book_borrows_updated_at BEFORE UPDATE ON book_borrows FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_borrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── RLS POLICIES ─────────────────────────────────────────────

-- SCHOOLS: Super admin sees all, school users see their school
CREATE POLICY "schools_select" ON schools FOR SELECT
  USING (is_super_admin() OR id = get_user_school_id());

CREATE POLICY "schools_insert" ON schools FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "schools_update" ON schools FOR UPDATE
  USING (is_super_admin() OR (id = get_user_school_id() AND get_user_role() = 'school_admin'));

-- PROFILES: Users see profiles in their school
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    is_super_admin() OR
    user_id = auth.uid() OR
    school_id = get_user_school_id()
  );

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (user_id = auth.uid() OR is_super_admin() OR get_user_role() = 'school_admin');

-- School-scoped tables (generic policy pattern)
-- These apply to most tables with school_id

CREATE POLICY "school_data_access" ON academic_years FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON terms FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON departments FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON subjects FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON classes FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON class_subjects FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON teachers FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON students FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON guardians FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON attendance_records FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON attendance_entries FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON teacher_attendance FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON grading_scales FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON exam_types FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON exams FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON exam_results FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON assignments FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON assignment_submissions FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON timetable_slots FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON fee_categories FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON fee_structures FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON invoices FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON payments FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON books FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON book_borrows FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON hostel_blocks FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON hostel_rooms FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON hostel_allocations FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON vehicles FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON transport_routes FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON student_transport FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

CREATE POLICY "school_data_access" ON announcements FOR ALL
  USING (is_super_admin() OR school_id = get_user_school_id());

-- Messages: only sender and recipient
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    is_super_admin() OR
    school_id = get_user_school_id() AND (
      sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
      recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (school_id = get_user_school_id());

-- Notifications: only for the user
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (
    is_super_admin() OR
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Audit logs: super admin or school admin
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING (
    is_super_admin() OR
    (school_id = get_user_school_id() AND get_user_role() = 'school_admin')
  );

-- ============================================================
-- VIEWS
-- ============================================================

-- Student with class and guardian info
CREATE OR REPLACE VIEW student_details AS
SELECT 
  s.*,
  c.name AS class_name,
  c.section AS class_section,
  c.level AS class_level,
  g.first_name AS guardian_first_name,
  g.last_name AS guardian_last_name,
  g.phone AS guardian_phone,
  g.email AS guardian_email,
  g.relationship AS guardian_relationship
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN guardians g ON g.student_id = s.id AND g.is_primary = true;

-- Class attendance summary
CREATE OR REPLACE VIEW class_attendance_summary AS
SELECT 
  ae.student_id,
  ar.class_id,
  ar.term_id,
  ar.academic_year_id,
  ar.school_id,
  COUNT(*) AS total_days,
  COUNT(*) FILTER (WHERE ae.status = 'present') AS days_present,
  COUNT(*) FILTER (WHERE ae.status = 'absent') AS days_absent,
  COUNT(*) FILTER (WHERE ae.status = 'late') AS days_late,
  COUNT(*) FILTER (WHERE ae.status = 'excused') AS days_excused,
  ROUND(
    COUNT(*) FILTER (WHERE ae.status IN ('present', 'late')) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) AS attendance_percentage
FROM attendance_entries ae
JOIN attendance_records ar ON ae.attendance_record_id = ar.id
GROUP BY ae.student_id, ar.class_id, ar.term_id, ar.academic_year_id, ar.school_id;

-- Finance summary per student per term
CREATE OR REPLACE VIEW student_finance_summary AS
SELECT 
  i.student_id,
  i.school_id,
  i.term_id,
  i.academic_year_id,
  SUM(i.total_amount) AS total_invoiced,
  SUM(i.amount_paid) AS total_paid,
  SUM(i.balance) AS total_balance,
  COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_invoices,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_invoices
FROM invoices i
GROUP BY i.student_id, i.school_id, i.term_id, i.academic_year_id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Calculate grade from percentage
CREATE OR REPLACE FUNCTION calculate_grade(
  p_school_id UUID,
  p_percentage NUMERIC
)
RETURNS TABLE(grade TEXT, grade_points NUMERIC, description TEXT) AS $$
DECLARE
  v_scale JSONB;
  v_grade JSONB;
BEGIN
  SELECT grades INTO v_scale
  FROM grading_scales
  WHERE school_id = p_school_id AND is_default = true
  LIMIT 1;
  
  FOR v_grade IN SELECT * FROM jsonb_array_elements(v_scale)
  LOOP
    IF p_percentage >= (v_grade->>'min_percentage')::NUMERIC 
       AND p_percentage <= (v_grade->>'max_percentage')::NUMERIC THEN
      RETURN QUERY SELECT 
        v_grade->>'grade',
        (v_grade->>'grade_points')::NUMERIC,
        v_grade->>'description';
      RETURN;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Calculate class positions
CREATE OR REPLACE FUNCTION calculate_positions(p_exam_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT id, 
           RANK() OVER (ORDER BY marks_obtained DESC) AS pos
    FROM exam_results
    WHERE exam_id = p_exam_id AND is_absent = false
  )
  UPDATE exam_results er
  SET position = r.pos
  FROM ranked r
  WHERE er.id = r.id;
END;
$$ LANGUAGE plpgsql;

-- Get dashboard stats for a school
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_school_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_students', (SELECT COUNT(*) FROM students WHERE school_id = p_school_id AND is_active = true),
    'total_teachers', (SELECT COUNT(*) FROM teachers WHERE school_id = p_school_id AND is_active = true),
    'total_classes', (SELECT COUNT(*) FROM classes c 
                      JOIN academic_years ay ON c.academic_year_id = ay.id 
                      WHERE c.school_id = p_school_id AND ay.is_current = true),
    'total_active_exams', (SELECT COUNT(*) FROM exams WHERE school_id = p_school_id AND status = 'scheduled'),
    'total_books', (SELECT COUNT(*) FROM books WHERE school_id = p_school_id),
    'total_fees_expected', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices 
                            WHERE school_id = p_school_id AND 
                            term_id = (SELECT id FROM terms WHERE school_id = p_school_id AND is_current = true LIMIT 1)),
    'total_fees_collected', (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices 
                             WHERE school_id = p_school_id AND
                             term_id = (SELECT id FROM terms WHERE school_id = p_school_id AND is_current = true LIMIT 1))
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
