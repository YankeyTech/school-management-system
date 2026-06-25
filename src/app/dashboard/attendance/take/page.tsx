import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Take Attendance' };

export default async function TakeAttendancePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');
  if (!['super_admin', 'school_admin', 'teacher'].includes(profile.role)) {
    redirect('/dashboard/home');
  }

  // Get teacher's classes
  let classesQuery = supabase
    .from('classes')
    .select('id, name, section, level')
    .eq('school_id', profile.school_id)
    .order('level', { ascending: true });

  // If teacher, only show their assigned classes
  if (profile.role === 'teacher') {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (teacher) {
      const { data: classSubs } = await supabase
        .from('class_subjects')
        .select('class_id')
        .eq('teacher_id', teacher.id)
        .eq('school_id', profile.school_id);

      const classIds = classSubs?.map(c => c.class_id) ?? [];
      if (classIds.length > 0) {
        classesQuery = classesQuery.in('id', classIds);
      }
    }
  }

  const [classesResult, currentTermResult] = await Promise.all([
    classesQuery,
    supabase
      .from('terms')
      .select('id, name')
      .eq('school_id', profile.school_id)
      .eq('is_current', true)
      .single(),
  ]);

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/dashboard/attendance"
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="page-title">Take Attendance</h1>
          <p className="page-description">
            {currentTermResult.data?.name ?? 'Current Term'} ·{' '}
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <AttendanceForm
        classes={classesResult.data ?? []}
        termId={currentTermResult.data?.id ?? ''}
        schoolId={profile.school_id}
        profileId={profile.id}
      />
    </div>
  );
}
