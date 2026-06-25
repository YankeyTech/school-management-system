import { z } from 'zod';

// ─── Common ───────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[+\d\s\-()]+$/, 'Invalid phone number format');

export const dateSchema = z.string().min(1, 'Date is required').refine(
  (val) => !isNaN(Date.parse(val)),
  'Invalid date'
);

export const uuidSchema = z.string().uuid('Invalid ID');

// ─── Auth ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name too short'),
  lastName: z.string().min(2, 'Last name too short'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ─── School ───────────────────────────────────────────────────

export const schoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  code: z.string().min(3).max(10).toUpperCase(),
  email: z.string().email('Invalid school email'),
  phone: phoneSchema,
  address: z.string().min(10, 'Please enter a complete address'),
  city: z.string().min(2, 'City is required'),
  region: z.string().min(2, 'Region is required'),
  country: z.string().default('Ghana'),
  website: z.string().url().optional().or(z.literal('')),
});

// ─── Student ──────────────────────────────────────────────────

export const studentSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  other_names: z.string().optional(),
  date_of_birth: dateSchema,
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().min(1, 'Nationality is required'),
  religion: z.string().optional(),
  class_id: uuidSchema,
  admission_date: dateSchema,
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: phoneSchema,
  is_boarding: z.boolean().default(false),
  // Guardian
  guardian_first_name: z.string().min(2, 'Guardian first name required'),
  guardian_last_name: z.string().min(2, 'Guardian last name required'),
  guardian_relationship: z.enum(['father', 'mother', 'guardian', 'sibling', 'other']),
  guardian_phone: phoneSchema,
  guardian_email: z.string().email().optional().or(z.literal('')),
  guardian_occupation: z.string().optional(),
});

// ─── Teacher ──────────────────────────────────────────────────

export const teacherSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  other_names: z.string().optional(),
  date_of_birth: dateSchema,
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().min(1, 'Nationality is required'),
  email: z.string().email('Invalid email address'),
  phone: phoneSchema,
  address: z.string().min(5, 'Address is required'),
  department_id: uuidSchema.optional(),
  position: z.string().min(2, 'Position is required'),
  employment_type: z.enum(['full_time', 'part_time', 'contract']),
  hire_date: dateSchema,
  highest_qualification: z.string().min(2, 'Qualification is required'),
  basic_salary: z.number().min(0).optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
});

// ─── Exam ─────────────────────────────────────────────────────

export const examSchema = z.object({
  name: z.string().min(3, 'Exam name is required'),
  exam_type_id: uuidSchema,
  class_id: uuidSchema,
  subject_id: uuidSchema,
  term_id: uuidSchema,
  start_datetime: z.string().min(1, 'Start date/time is required'),
  end_datetime: z.string().min(1, 'End date/time is required'),
  venue: z.string().optional(),
  total_marks: z.number().min(1, 'Total marks must be positive'),
  passing_marks: z.number().min(0),
  duration_minutes: z.number().min(15, 'Duration must be at least 15 minutes'),
  instructions: z.string().optional(),
}).refine(
  (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
  { message: 'End time must be after start time', path: ['end_datetime'] }
);

// ─── Exam Result ──────────────────────────────────────────────

export const examResultSchema = z.object({
  student_id: uuidSchema,
  marks_obtained: z.number().min(0, 'Marks cannot be negative'),
  is_absent: z.boolean().default(false),
  teacher_comment: z.string().max(500).optional(),
  remarks: z.string().max(200).optional(),
});

// ─── Assignment ───────────────────────────────────────────────

export const assignmentSchema = z.object({
  title: z.string().min(3, 'Assignment title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().optional(),
  class_id: uuidSchema,
  subject_id: uuidSchema,
  term_id: uuidSchema,
  total_marks: z.number().min(1).default(100),
  due_date: z.string().min(1, 'Due date is required'),
});

// ─── Fee Structure ────────────────────────────────────────────

export const feeStructureSchema = z.object({
  fee_category_id: uuidSchema,
  name: z.string().min(3, 'Fee name is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  class_id: uuidSchema.optional(),
  term_id: uuidSchema.optional(),
  due_date: dateSchema,
  late_fee: z.number().min(0).optional(),
  late_fee_type: z.enum(['fixed', 'percentage']).optional(),
});

// ─── Payment ──────────────────────────────────────────────────

export const paymentSchema = z.object({
  invoice_id: uuidSchema,
  amount: z.number().min(0.01, 'Payment amount must be positive'),
  payment_date: dateSchema,
  payment_method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque']),
  mobile_money_provider: z.enum(['mtn_momo', 'telecel_cash', 'airteltigo']).optional(),
  mobile_money_number: z.string().optional(),
  transaction_reference: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Timetable ────────────────────────────────────────────────

export const timetableSlotSchema = z.object({
  class_id: uuidSchema,
  subject_id: uuidSchema,
  teacher_id: uuidSchema,
  term_id: uuidSchema,
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  room: z.string().optional(),
});

// ─── Announcement ─────────────────────────────────────────────

export const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  target_roles: z.array(z.enum(['super_admin', 'school_admin', 'teacher', 'parent', 'student'])).min(1),
  target_classes: z.array(uuidSchema).optional(),
  is_pinned: z.boolean().default(false),
  expires_at: z.string().optional(),
});

// ─── Book ─────────────────────────────────────────────────────

export const bookSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  author: z.string().min(2, 'Author is required'),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  category: z.string().min(2, 'Category is required'),
  total_copies: z.number().min(1, 'Must have at least 1 copy'),
  location: z.string().optional(),
  description: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type TeacherFormData = z.infer<typeof teacherSchema>;
export type ExamFormData = z.infer<typeof examSchema>;
export type ExamResultFormData = z.infer<typeof examResultSchema>;
export type AssignmentFormData = z.infer<typeof assignmentSchema>;
export type FeeStructureFormData = z.infer<typeof feeStructureSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type BookFormData = z.infer<typeof bookSchema>;
