import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { FinanceChart } from '@/components/dashboard/FinanceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingExams } from '@/components/dashboard/UpcomingExams';
import { QuickActions } from '@/components/dashboard/QuickActions';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardHomePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');

  // Fetch all dashboard data in parallel
  const [
    studentsResult,
    teachersResult,
    classesResult,
    examsResult,
    invoicesResult,
    recentPaymentsResult,
    recentStudentsResult,
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id, is_active, gender, created_at')
      .eq('school_id', profile.school_id),
    
    supabase
      .from('teachers')
      .select('id, is_active, department_id')
      .eq('school_id', profile.school_id),
    
    supabase
      .from('classes')
      .select('id, name, capacity')
      .eq('school_id', profile.school_id),
    
    supabase
      .from('exams')
      .select('id, name, start_datetime, status, subjects(name), classes(name)')
      .eq('school_id', profile.school_id)
      .eq('status', 'scheduled')
      .gte('start_datetime', new Date().toISOString())
      .order('start_datetime', { ascending: true })
      .limit(5),
    
    supabase
      .from('invoices')
      .select('total_amount, amount_paid, status')
      .eq('school_id', profile.school_id),
    
    supabase
      .from('payments')
      .select('amount, payment_date, payment_method, students(first_name, last_name)')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('students')
      .select('first_name, last_name, admission_date, classes(name)')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const students = studentsResult.data ?? [];
  const teachers = teachersResult.data ?? [];
  const classes = classesResult.data ?? [];
  const exams = examsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const recentPayments = recentPaymentsResult.data ?? [];

  const totalFees = invoices.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0);

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.is_active).length,
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter(t => t.is_active).length,
    totalClasses: classes.length,
    upcomingExams: exams.length,
    totalFees,
    totalCollected,
    collectionRate: totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0,
  };

  return (
    <div className="page-container">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {profile.first_name} 👋
          </h1>
          <p className="page-description">
            Here&apos;s what&apos;s happening at your school today.
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('en-GH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-muted-foreground">Academic Year 2024/2025</p>
        </div>
      </div>

      {/* Stats grid */}
      <DashboardStats stats={stats} />

      {/* Quick actions */}
      <QuickActions role={profile.role} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart schoolId={profile.school_id} />
        </div>
        <div>
          <FinanceChart 
            totalFees={totalFees} 
            totalCollected={totalCollected} 
            collectionRate={stats.collectionRate} 
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingExams exams={exams as any} />
        <RecentActivity payments={recentPayments as any} />
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
