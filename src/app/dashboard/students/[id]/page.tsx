import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, QrCode, FileText, Printer,
  Phone, Mail, MapPin, Heart, GraduationCap,
  Calendar, User, AlertTriangle, Bus
} from 'lucide-react';
import { AttendanceSummaryCard } from '@/components/students/AttendanceSummaryCard';
import { StudentResultsSummary } from '@/components/students/StudentResultsSummary';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return { title: 'Student Profile' };
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');

  const { data: student } = await supabase
    .from('students')
    .select(`
      *,
      classes(id, name, section, level),
      guardians(*),
      hostel_rooms(room_number, hostel_blocks(name))
    `)
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .single();

  if (!student) notFound();

  const canManage = ['super_admin', 'school_admin'].includes(profile.role);

  const age = student.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(student.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const primaryGuardian = student.guardians?.find((g: any) => g.is_primary);

  return (
    <div className="page-container max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/students"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title">
                {student.first_name} {student.other_names ? student.other_names + ' ' : ''}
                {student.last_name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  student.is_active
                    ? 'badge-active'
                    : 'badge-inactive'
                }`}
              >
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="page-description">
              {student.student_id} · {student.admission_number}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors">
              <QrCode className="h-4 w-4" />
              ID Card
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <Link
              href={`/dashboard/students/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — identity card */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <h2 className="font-semibold text-foreground text-lg">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">{student.student_id}</p>

            <div className="w-full mt-4 pt-4 border-t border-border space-y-2.5 text-left">
              <InfoRow icon={GraduationCap} label="Class">
                {student.classes
                  ? `${student.classes.name}${student.classes.section ? ` (${student.classes.section})` : ''}`
                  : 'Unassigned'}
              </InfoRow>
              <InfoRow icon={User} label="Gender">
                <span className="capitalize">{student.gender}</span>
              </InfoRow>
              <InfoRow icon={Calendar} label="Age">
                {age ? `${age} years old` : '—'}
              </InfoRow>
              <InfoRow icon={MapPin} label="Nationality">
                {student.nationality}
              </InfoRow>
              {student.is_boarding && (
                <InfoRow icon={Bus} label="Hostel">
                  {student.hostel_rooms
                    ? `${student.hostel_rooms.hostel_blocks?.name} · Room ${student.hostel_rooms.room_number}`
                    : 'Boarding (unassigned)'}
                </InfoRow>
              )}
            </div>
          </div>

          {/* Contact card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Contact</h3>
            <div className="space-y-2.5">
              {student.phone && (
                <InfoRow icon={Phone} label="Phone">{student.phone}</InfoRow>
              )}
              {student.email && (
                <InfoRow icon={Mail} label="Email">{student.email}</InfoRow>
              )}
              <InfoRow icon={MapPin} label="Address">
                {student.address}
              </InfoRow>
            </div>
          </div>

          {/* Medical card */}
          {(student.blood_group || student.allergies?.length || student.medical_conditions?.length) && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Medical Info
              </h3>
              <div className="space-y-2.5">
                {student.blood_group && (
                  <InfoRow icon={Heart} label="Blood Group">{student.blood_group}</InfoRow>
                )}
                {student.allergies?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                    <div className="flex flex-wrap gap-1">
                      {student.allergies.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {student.medical_conditions?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {student.medical_conditions.map((c: string) => (
                        <span key={c} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency contact */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5">
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Emergency Contact
            </h3>
            <p className="text-sm font-medium text-foreground">{student.emergency_contact_name}</p>
            <p className="text-sm text-muted-foreground">{student.emergency_contact_phone}</p>
          </div>
        </div>

        {/* Right columns — tabs content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guardian */}
          {primaryGuardian && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Primary Guardian</h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {primaryGuardian.first_name[0]}{primaryGuardian.last_name[0]}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium text-foreground">
                      {primaryGuardian.first_name} {primaryGuardian.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Relationship</p>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {primaryGuardian.relationship}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{primaryGuardian.phone}</p>
                  </div>
                  {primaryGuardian.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{primaryGuardian.email}</p>
                    </div>
                  )}
                  {primaryGuardian.occupation && (
                    <div>
                      <p className="text-xs text-muted-foreground">Occupation</p>
                      <p className="text-sm font-medium text-foreground">{primaryGuardian.occupation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Summary */}
          <AttendanceSummaryCard studentId={id} schoolId={profile.school_id} />

          {/* Results Summary */}
          <StudentResultsSummary studentId={id} schoolId={profile.school_id} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs text-foreground font-medium">{children}</p>
      </div>
    </div>
  );
}
