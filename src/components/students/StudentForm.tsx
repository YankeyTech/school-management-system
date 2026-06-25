'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Phone, MapPin, Heart, Users, GraduationCap } from 'lucide-react';

const studentSchema = z.object({
  // Personal info
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  other_names: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().min(1, 'Nationality is required'),
  religion: z.string().optional(),

  // Academic
  class_id: z.string().uuid('Please select a class'),
  admission_date: z.string().min(1, 'Admission date is required'),

  // Contact
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address is required'),

  // Medical
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Valid phone number required'),

  // Boarding
  is_boarding: z.boolean().default(false),

  // Guardian
  guardian_first_name: z.string().min(2, 'Guardian first name required'),
  guardian_last_name: z.string().min(2, 'Guardian last name required'),
  guardian_relationship: z.enum(['father', 'mother', 'guardian', 'sibling', 'other']),
  guardian_phone: z.string().min(10, 'Valid phone number required'),
  guardian_email: z.string().email().optional().or(z.literal('')),
  guardian_occupation: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Class {
  id: string;
  name: string;
  section?: string;
  level: number;
}

interface StudentFormProps {
  classes: Class[];
  academicYearId?: string;
  schoolId: string;
  defaultValues?: Partial<StudentFormData>;
  studentId?: string;
}

const SECTIONS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'academic', label: 'Academic', icon: GraduationCap },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'medical', label: 'Medical', icon: Heart },
  { id: 'guardian', label: 'Guardian', icon: Users },
];

export function StudentForm({
  classes,
  academicYearId,
  schoolId,
  defaultValues,
  studentId,
}: StudentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nationality: 'Ghanaian',
      gender: 'male',
      guardian_relationship: 'father',
      is_boarding: false,
      admission_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  async function onSubmit(data: StudentFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Generate unique IDs
      const { data: schoolData } = await supabase
        .from('schools')
        .select('code')
        .eq('id', schoolId)
        .single();

      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      const seq = (count ?? 0) + 1;
      const studentIdGenerated = `${schoolData?.code ?? 'SCH'}-STU-${String(seq).padStart(5, '0')}`;
      const admissionNumber = `ADM-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

      // Insert student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          school_id: schoolId,
          student_id: studentIdGenerated,
          admission_number: admissionNumber,
          admission_date: data.admission_date,
          class_id: data.class_id,
          first_name: data.first_name,
          last_name: data.last_name,
          other_names: data.other_names || null,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          nationality: data.nationality,
          religion: data.religion || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          blood_group: data.blood_group || null,
          allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()) : [],
          medical_conditions: data.medical_conditions
            ? data.medical_conditions.split(',').map(s => s.trim())
            : [],
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          is_boarding: data.is_boarding,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Insert guardian
      const { error: guardianError } = await supabase.from('guardians').insert({
        school_id: schoolId,
        student_id: student.id,
        first_name: data.guardian_first_name,
        last_name: data.guardian_last_name,
        relationship: data.guardian_relationship,
        phone: data.guardian_phone,
        email: data.guardian_email || null,
        occupation: data.guardian_occupation || null,
        is_primary: true,
        has_portal_access: false,
      });

      if (guardianError) throw guardianError;

      toast.success('Student registered successfully!', {
        description: `${data.first_name} ${data.last_name} — ${studentIdGenerated}`,
      });

      router.push(`/dashboard/students/${student.id}`);
    } catch (err: any) {
      toast.error('Failed to register student', {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = `w-full px-3 py-2.5 text-sm bg-background border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-ring transition-all
    placeholder:text-muted-foreground text-foreground`;

  const errorClass = 'border-red-400 dark:border-red-500';
  const normalClass = 'border-border';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all whitespace-nowrap flex-1 justify-center
              ${activeSection === s.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeSection === 'personal' && (
        <div className="form-section space-y-4">
          <h2 className="form-section-title">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('first_name')}
                className={`${inputClass} ${errors.first_name ? errorClass : normalClass}`}
                placeholder="e.g. Kwame"
              />
              {errors.first_name && (
                <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('last_name')}
                className={`${inputClass} ${errors.last_name ? errorClass : normalClass}`}
                placeholder="e.g. Mensah"
              />
              {errors.last_name && (
                <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Other Names
              </label>
              <input
                {...register('other_names')}
                className={`${inputClass} ${normalClass}`}
                placeholder="Middle names"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date_of_birth')}
                className={`${inputClass} ${errors.date_of_birth ? errorClass : normalClass}`}
              />
              {errors.date_of_birth && (
                <p className="text-xs text-red-500 mt-1">{errors.date_of_birth.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                {...register('gender')}
                className={`${inputClass} ${normalClass} cursor-pointer`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nationality')}
                className={`${inputClass} ${normalClass}`}
                placeholder="e.g. Ghanaian"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Religion</label>
              <input
                {...register('religion')}
                className={`${inputClass} ${normalClass}`}
                placeholder="e.g. Christianity, Islam"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_boarding"
                {...register('is_boarding')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="is_boarding" className="text-sm font-medium text-foreground">
                Boarding Student
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Academic */}
      {activeSection === 'academic' && (
        <div className="form-section space-y-4">
          <h2 className="form-section-title">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                {...register('class_id')}
                className={`${inputClass} ${errors.class_id ? errorClass : normalClass} cursor-pointer`}
              >
                <option value="">Select class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}{cls.section ? ` (${cls.section})` : ''}
                  </option>
                ))}
              </select>
              {errors.class_id && (
                <p className="text-xs text-red-500 mt-1">{errors.class_id.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Admission Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('admission_date')}
                className={`${inputClass} ${errors.admission_date ? errorClass : normalClass}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      {activeSection === 'contact' && (
        <div className="form-section space-y-4">
          <h2 className="form-section-title">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className={`${inputClass} ${normalClass}`}
                placeholder="student@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phone Number
              </label>
              <input
                {...register('phone')}
                className={`${inputClass} ${normalClass}`}
                placeholder="024 XXX XXXX"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Home Address <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className={`${inputClass} ${errors.address ? errorClass : normalClass} resize-none`}
              placeholder="Full home address"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Emergency Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('emergency_contact_name')}
                className={`${inputClass} ${errors.emergency_contact_name ? errorClass : normalClass}`}
                placeholder="Full name"
              />
              {errors.emergency_contact_name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emergency_contact_name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Emergency Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                {...register('emergency_contact_phone')}
                className={`${inputClass} ${errors.emergency_contact_phone ? errorClass : normalClass}`}
                placeholder="024 XXX XXXX"
              />
              {errors.emergency_contact_phone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emergency_contact_phone.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Medical */}
      {activeSection === 'medical' && (
        <div className="form-section space-y-4">
          <h2 className="form-section-title">Medical Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Blood Group</label>
              <select
                {...register('blood_group')}
                className={`${inputClass} ${normalClass} cursor-pointer`}
              >
                <option value="">Unknown / Not tested</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Allergies
            </label>
            <input
              {...register('allergies')}
              className={`${inputClass} ${normalClass}`}
              placeholder="Comma-separated: e.g. Penicillin, Peanuts, Dust"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Medical Conditions
            </label>
            <textarea
              {...register('medical_conditions')}
              rows={3}
              className={`${inputClass} ${normalClass} resize-none`}
              placeholder="Comma-separated: e.g. Asthma, Diabetes"
            />
          </div>
        </div>
      )}

      {/* Guardian */}
      {activeSection === 'guardian' && (
        <div className="form-section space-y-4">
          <h2 className="form-section-title">Primary Guardian / Parent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('guardian_first_name')}
                className={`${inputClass} ${errors.guardian_first_name ? errorClass : normalClass}`}
                placeholder="Guardian first name"
              />
              {errors.guardian_first_name && (
                <p className="text-xs text-red-500 mt-1">{errors.guardian_first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('guardian_last_name')}
                className={`${inputClass} ${errors.guardian_last_name ? errorClass : normalClass}`}
                placeholder="Guardian last name"
              />
              {errors.guardian_last_name && (
                <p className="text-xs text-red-500 mt-1">{errors.guardian_last_name.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                {...register('guardian_relationship')}
                className={`${inputClass} ${normalClass} cursor-pointer`}
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                {...register('guardian_phone')}
                className={`${inputClass} ${errors.guardian_phone ? errorClass : normalClass}`}
                placeholder="024 XXX XXXX"
              />
              {errors.guardian_phone && (
                <p className="text-xs text-red-500 mt-1">{errors.guardian_phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                {...register('guardian_email')}
                className={`${inputClass} ${normalClass}`}
                placeholder="parent@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Occupation</label>
            <input
              {...register('guardian_occupation')}
              className={`${inputClass} ${normalClass}`}
              placeholder="e.g. Teacher, Trader, Engineer"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex gap-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`w-2 h-2 rounded-full transition-all ${
                activeSection === s.id ? 'bg-primary w-6' : 'bg-border'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {studentId ? 'Update Student' : 'Register Student'}
          </button>
        </div>
      </div>
    </form>
  );
}
