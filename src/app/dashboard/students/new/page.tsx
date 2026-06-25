import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentForm } from '@/components/students/StudentForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Add Student' };

export default async function NewStudentPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');
  if (!['super_admin', 'school_admin'].includes(profile.role)) redirect('/dashboard/students');

  const [classesResult, academicYearResult] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, section, level')
      .eq('school_id', profile.school_id)
      .order('level', { ascending: true }),
    supabase
      .from('academic_years')
      .select('id, name')
      .eq('school_id', profile.school_id)
      .eq('is_current', true)
      .single(),
  ]);

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/dashboard/students"
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="page-title">Add New Student</h1>
          <p className="page-description">Fill in the student information below</p>
        </div>
      </div>

      <StudentForm
        classes={classesResult.data ?? []}
        academicYearId={academicYearResult.data?.id}
        schoolId={profile.school_id}
      />
    </div>
  );
}
