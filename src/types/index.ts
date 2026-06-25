// ============================================================
// EDUCORE - Complete Type Definitions
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type UserRole = 
  | 'super_admin' 
  | 'school_admin' 
  | 'teacher' 
  | 'parent' 
  | 'student';

export type SchoolStatus = 'active' | 'suspended' | 'trial' | 'expired';

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export type Gender = 'male' | 'female' | 'other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type ExamStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export type AssignmentStatus = 'draft' | 'published' | 'closed';

export type SubmissionStatus = 'submitted' | 'graded' | 'late' | 'missing';

export type FeeStatus = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'waived';

export type PaymentMethod = 
  | 'cash' 
  | 'bank_transfer' 
  | 'mobile_money' 
  | 'card' 
  | 'cheque';

export type MobileMoneyProvider = 'mtn_momo' | 'telecel_cash' | 'airteltigo';

export type BookStatus = 'available' | 'borrowed' | 'reserved' | 'lost' | 'damaged';

export type RoomType = 'dormitory' | 'private' | 'semi_private';

export type NotificationType = 
  | 'announcement' 
  | 'fee_reminder' 
  | 'attendance_alert'
  | 'exam_schedule'
  | 'result_published'
  | 'assignment_due'
  | 'general';

export type DayOfWeek = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday';

export type TermType = 'first' | 'second' | 'third';

export type ReportType = 
  | 'attendance' 
  | 'academic' 
  | 'finance' 
  | 'student' 
  | 'teacher';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

// ─── Base Types ───────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface AuditFields {
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

// ─── Auth & Users ─────────────────────────────────────────────

export interface Profile extends BaseEntity {
  user_id: string;
  school_id?: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_seen?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  school?: School;
}

// ─── School ───────────────────────────────────────────────────

export interface School extends BaseEntity, AuditFields {
  name: string;
  code: string; // unique short code e.g. "GIS001"
  logo_url?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  country: string;
  website?: string;
  status: SchoolStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at?: string;
  max_students: number;
  max_teachers: number;
  settings: SchoolSettings;
}

export interface SchoolSettings {
  grading_system: 'percentage' | 'gpa' | 'letter' | 'custom';
  academic_year_start_month: number;
  terms_per_year: 2 | 3;
  attendance_method: 'manual' | 'qr' | 'both';
  currency: string;
  currency_symbol: string;
  timezone: string;
  language: string;
  sms_enabled: boolean;
  email_notifications: boolean;
  parent_portal_enabled: boolean;
  student_portal_enabled: boolean;
}

// ─── Academic Year & Terms ─────────────────────────────────────

export interface AcademicYear extends BaseEntity {
  school_id: string;
  name: string; // e.g. "2024/2025"
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Term extends BaseEntity {
  school_id: string;
  academic_year_id: string;
  name: string; // e.g. "First Term"
  term_type: TermType;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

// ─── Departments & Subjects ────────────────────────────────────

export interface Department extends BaseEntity {
  school_id: string;
  name: string;
  code: string;
  head_teacher_id?: string;
  description?: string;
}

export interface Subject extends BaseEntity {
  school_id: string;
  department_id?: string;
  name: string;
  code: string;
  description?: string;
  is_elective: boolean;
  credit_hours?: number;
}

// ─── Classes & Streams ─────────────────────────────────────────

export interface Class extends BaseEntity {
  school_id: string;
  name: string; // e.g. "Grade 10", "Form 3", "JHS 2"
  level: number;
  section?: string; // A, B, C
  capacity: number;
  class_teacher_id?: string;
  academic_year_id: string;
}

export interface ClassSubject extends BaseEntity {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  school_id: string;
}

// ─── Students ─────────────────────────────────────────────────

export interface Student extends BaseEntity, AuditFields {
  school_id: string;
  profile_id: string;
  student_id: string; // auto-generated unique ID
  admission_number: string;
  admission_date: string;
  class_id?: string;
  
  // Personal Info
  first_name: string;
  last_name: string;
  other_names?: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  religion?: string;
  
  // Contact
  email?: string;
  phone?: string;
  address: string;
  
  // Medical
  blood_group?: BloodGroup;
  allergies?: string[];
  medical_conditions?: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  
  // Documents
  avatar_url?: string;
  birth_certificate_url?: string;
  
  // Status
  is_active: boolean;
  is_boarding: boolean;
  hostel_room_id?: string;
}

export interface Guardian extends BaseEntity {
  school_id: string;
  student_id: string;
  profile_id?: string; // if parent has portal access
  
  first_name: string;
  last_name: string;
  relationship: 'father' | 'mother' | 'guardian' | 'sibling' | 'other';
  email?: string;
  phone: string;
  occupation?: string;
  address?: string;
  is_primary: boolean;
  has_portal_access: boolean;
}

// ─── Teachers ─────────────────────────────────────────────────

export interface Teacher extends BaseEntity, AuditFields {
  school_id: string;
  profile_id: string;
  teacher_id: string; // auto-generated
  employee_id: string;
  
  first_name: string;
  last_name: string;
  other_names?: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  
  email: string;
  phone: string;
  address: string;
  
  // Employment
  hire_date: string;
  department_id?: string;
  position: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  
  // Qualifications
  highest_qualification: string;
  qualifications: Qualification[];
  
  // Banking (for payroll)
  bank_name?: string;
  bank_account?: string;
  basic_salary?: number;
  
  avatar_url?: string;
  is_active: boolean;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  certificate_url?: string;
}

// ─── Attendance ────────────────────────────────────────────────

export interface AttendanceRecord extends BaseEntity {
  school_id: string;
  class_id: string;
  subject_id?: string;
  term_id: string;
  academic_year_id: string;
  date: string;
  taken_by: string; // teacher_id
  records: AttendanceEntry[];
}

export interface AttendanceEntry {
  student_id: string;
  status: AttendanceStatus;
  time_in?: string;
  remarks?: string;
  qr_verified?: boolean;
}

export interface TeacherAttendance extends BaseEntity {
  school_id: string;
  teacher_id: string;
  date: string;
  status: AttendanceStatus;
  time_in?: string;
  time_out?: string;
  remarks?: string;
}

// ─── Exams & Grades ───────────────────────────────────────────

export interface ExamType extends BaseEntity {
  school_id: string;
  name: string; // "Mid-Term", "End of Term", "Mock", "BECE"
  weight: number; // percentage weight toward final grade
  term_id?: string;
}

export interface Exam extends BaseEntity, AuditFields {
  school_id: string;
  exam_type_id: string;
  term_id: string;
  academic_year_id: string;
  name: string;
  class_id: string;
  subject_id: string;
  
  start_datetime: string;
  end_datetime: string;
  venue?: string;
  total_marks: number;
  passing_marks: number;
  duration_minutes: number;
  
  status: ExamStatus;
  instructions?: string;
  invigilator_id?: string;
}

export interface ExamResult extends BaseEntity, AuditFields {
  school_id: string;
  exam_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  academic_year_id: string;
  
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  grade_points: number;
  position?: number;
  remarks?: string;
  
  // AI-generated comment
  ai_comment?: string;
  teacher_comment?: string;
  
  is_absent: boolean;
  entered_by: string;
}

export interface GradingScale extends BaseEntity {
  school_id: string;
  name: string;
  is_default: boolean;
  grades: GradeDefinition[];
}

export interface GradeDefinition {
  grade: string; // A, B+, C, etc.
  min_percentage: number;
  max_percentage: number;
  grade_points: number;
  description: string; // Excellent, Very Good, etc.
}

export interface ReportCard {
  student: Student;
  class: Class;
  term: Term;
  academic_year: AcademicYear;
  results: SubjectResult[];
  attendance: AttendanceSummary;
  gpa: number;
  total_percentage: number;
  overall_grade: string;
  overall_position: number;
  total_students: number;
  class_teacher_comment?: string;
  principal_comment?: string;
  promotion_status?: 'promoted' | 'repeated' | 'transferred';
}

export interface SubjectResult {
  subject: Subject;
  scores: ExamScore[];
  final_score: number;
  grade: string;
  grade_points: number;
  position: number;
  teacher_comment?: string;
  ai_comment?: string;
}

export interface ExamScore {
  exam_type: ExamType;
  marks: number;
  total: number;
  percentage: number;
}

export interface AttendanceSummary {
  total_days: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  percentage: number;
}

// ─── Assignments ──────────────────────────────────────────────

export interface Assignment extends BaseEntity, AuditFields {
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  term_id: string;
  
  title: string;
  description: string;
  instructions?: string;
  total_marks: number;
  due_date: string;
  
  attachments?: string[]; // URLs
  status: AssignmentStatus;
}

export interface AssignmentSubmission extends BaseEntity {
  assignment_id: string;
  student_id: string;
  school_id: string;
  
  content?: string;
  file_urls?: string[];
  submitted_at: string;
  
  status: SubmissionStatus;
  marks_obtained?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
}

// ─── Timetable ─────────────────────────────────────────────────

export interface TimetableSlot extends BaseEntity {
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  term_id: string;
  
  day_of_week: DayOfWeek;
  start_time: string; // "08:00"
  end_time: string;   // "09:00"
  room?: string;
}

// ─── Finance ──────────────────────────────────────────────────

export interface FeeCategory extends BaseEntity {
  school_id: string;
  name: string; // "Tuition", "Sports", "Meals", "Boarding"
  description?: string;
  is_mandatory: boolean;
}

export interface FeeStructure extends BaseEntity, AuditFields {
  school_id: string;
  academic_year_id: string;
  term_id?: string;
  class_id?: string; // null = applies to all classes
  fee_category_id: string;
  
  name: string;
  amount: number;
  due_date: string;
  late_fee?: number;
  late_fee_type?: 'fixed' | 'percentage';
}

export interface Invoice extends BaseEntity, AuditFields {
  school_id: string;
  student_id: string;
  academic_year_id: string;
  term_id: string;
  
  invoice_number: string;
  issue_date: string;
  due_date: string;
  
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  discount_reason?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  
  status: FeeStatus;
  notes?: string;
}

export interface InvoiceItem {
  fee_structure_id: string;
  fee_category: string;
  description: string;
  amount: number;
  discount?: number;
}

export interface Payment extends BaseEntity, AuditFields {
  school_id: string;
  invoice_id: string;
  student_id: string;
  
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  
  // Mobile Money
  mobile_money_provider?: MobileMoneyProvider;
  mobile_money_number?: string;
  transaction_reference?: string;
  
  notes?: string;
  received_by: string;
}

// ─── Library ───────────────────────────────────────────────────

export interface Book extends BaseEntity, AuditFields {
  school_id: string;
  
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  edition?: string;
  subject?: string;
  category: string;
  
  total_copies: number;
  available_copies: number;
  cover_url?: string;
  
  location?: string; // shelf/rack
  description?: string;
}

export interface BookBorrow extends BaseEntity {
  school_id: string;
  book_id: string;
  borrower_id: string; // student_id or teacher_id
  borrower_type: 'student' | 'teacher';
  
  borrow_date: string;
  due_date: string;
  return_date?: string;
  
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  fine_amount?: number;
  fine_paid?: boolean;
  issued_by: string;
}

// ─── Hostel ────────────────────────────────────────────────────

export interface HostelBlock extends BaseEntity {
  school_id: string;
  name: string;
  gender: 'male' | 'female' | 'mixed';
  floors: number;
  warden_id?: string;
}

export interface HostelRoom extends BaseEntity {
  school_id: string;
  block_id: string;
  room_number: string;
  room_type: RoomType;
  capacity: number;
  occupied: number;
  floor: number;
  facilities?: string[];
}

export interface HostelAllocation extends BaseEntity {
  school_id: string;
  room_id: string;
  student_id: string;
  academic_year_id: string;
  bed_number: string;
  check_in_date: string;
  check_out_date?: string;
  is_active: boolean;
}

// ─── Transport ─────────────────────────────────────────────────

export interface Vehicle extends BaseEntity {
  school_id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  driver_id?: string;
  is_active: boolean;
}

export interface TransportRoute extends BaseEntity {
  school_id: string;
  name: string;
  description?: string;
  vehicle_id?: string;
  stops: RouteStop[];
  morning_departure: string;
  afternoon_departure: string;
  fee_per_term: number;
}

export interface RouteStop {
  name: string;
  time: string;
  latitude?: number;
  longitude?: number;
}

export interface StudentTransport extends BaseEntity {
  school_id: string;
  student_id: string;
  route_id: string;
  stop_name: string;
  academic_year_id: string;
  is_active: boolean;
}

// ─── Communication ─────────────────────────────────────────────

export interface Announcement extends BaseEntity, AuditFields {
  school_id: string;
  title: string;
  content: string;
  author_id: string;
  
  target_roles: UserRole[];
  target_classes?: string[];
  
  is_pinned: boolean;
  expires_at?: string;
  attachments?: string[];
}

export interface Message extends BaseEntity {
  school_id: string;
  sender_id: string;
  recipient_id: string;
  
  subject?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  parent_message_id?: string; // for threading
}

export interface Notification extends BaseEntity {
  school_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
}

// ─── AI Features ──────────────────────────────────────────────

export interface AIReportComment {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overall_comment: string;
}

export interface AIPerformanceAnalysis {
  student_id: string;
  period: string;
  trend: 'improving' | 'declining' | 'stable';
  weak_subjects: string[];
  strong_subjects: string[];
  attendance_impact: string;
  recommendations: string[];
  predicted_grade?: string;
}

// ─── Dashboard & Analytics ─────────────────────────────────────

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  attendance_rate: number;
  fee_collection_rate: number;
  total_fees_expected: number;
  total_fees_collected: number;
  active_exams: number;
  upcoming_exams: number;
  pending_assignments: number;
  unread_notifications: number;
}

export interface AttendanceAnalytics {
  date: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface FinanceAnalytics {
  month: string;
  expected: number;
  collected: number;
  outstanding: number;
}

export interface SubjectPerformance {
  subject: string;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
}

// ─── Pagination & Filters ──────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StudentFilters {
  class_id?: string;
  is_active?: boolean;
  gender?: Gender;
  is_boarding?: boolean;
  search?: string;
}

export interface TeacherFilters {
  department_id?: string;
  is_active?: boolean;
  employment_type?: Teacher['employment_type'];
  search?: string;
}

// ─── API Response ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Form Types ───────────────────────────────────────────────

export interface StudentFormData {
  first_name: string;
  last_name: string;
  other_names?: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  religion?: string;
  email?: string;
  phone?: string;
  address: string;
  class_id: string;
  admission_date: string;
  blood_group?: BloodGroup;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  is_boarding: boolean;
  
  // Guardian
  guardian_first_name: string;
  guardian_last_name: string;
  guardian_relationship: Guardian['relationship'];
  guardian_phone: string;
  guardian_email?: string;
}

export interface TeacherFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  email: string;
  phone: string;
  address: string;
  department_id?: string;
  position: string;
  employment_type: Teacher['employment_type'];
  hire_date: string;
  highest_qualification: string;
  basic_salary?: number;
}

export interface ExamFormData {
  name: string;
  exam_type_id: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  start_datetime: string;
  end_datetime: string;
  venue?: string;
  total_marks: number;
  passing_marks: number;
  duration_minutes: number;
  instructions?: string;
}

export interface FeeStructureFormData {
  fee_category_id: string;
  name: string;
  amount: number;
  class_id?: string;
  term_id?: string;
  due_date: string;
  late_fee?: number;
  late_fee_type?: 'fixed' | 'percentage';
}
