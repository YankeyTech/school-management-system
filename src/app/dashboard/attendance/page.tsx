import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, BarChart3, Calendar, QrCode } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Attendance' };

export default async function AttendancePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');

  const today = new Date().toISOString().split('T')[0];

  // Today's records
  const [todayRecordsResult, summaryResult] = await Promise.all([
    supabase
      .from('attendance_records')
      .select(`
        id, date, created_at,
        classes(name, section),
        profiles!taken_by(first_name, last_name),
        attendance_entries(status)
      `)
      .eq('school_id', profile.school_id)
      .eq('date', today)
      .order('created_at', { ascending: false }),

    supabase
      .from('attendance_entries')
      .select('status, attendance_records!inner(date, school_id)')
      .eq('attendance_records.school_id', profile.school_id)
      .eq('attendance_records.date', today),
  ]);

  const todayRecords = todayRecordsResult.data ?? [];
  const todayEntries = summaryResult.data ?? [];

  const presentCount = todayEntries.filter(e => e.status === 'present').length;
  const absentCount = todayEntries.filter(e => e.status === 'absent').length;
  const lateCount = todayEntries.filter(e => e.status === 'late').length;
  const totalCount = todayEntries.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const canTake = ['super_admin', 'school_admin', 'teacher'].includes(profile.role);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {canTake && (
          <div className="flex gap-2">
            <Link
              href="/dashboard/attendance/take"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ClipboardCheck className="h-4 w-4" />
              Take Attendance
            </Link>
          </div>
        )}
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: presentCount, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Absent', value: absentCount, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: 'Late', value: lateCount, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Attendance Rate', value: `${attendanceRate}%`, color: attendanceRate >= 90 ? 'text-emerald-600' : attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600', bg: 'bg-muted' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
        ))}
      </div>

      {/* Today's class records */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">
            Today's Attendance Records ({todayRecords.length} classes)
          </h3>
          <Link
            href="/dashboard/attendance/history"
            className="text-xs text-primary hover:underline font-medium"
          >
            View history
          </Link>
        </div>

        {todayRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm font-medium">No attendance taken today</p>
            {canTake && (
              <Link
                href="/dashboard/attendance/take"
                className="text-sm text-primary hover:underline"
              >
                Take attendance now →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayRecords.map((record: any) => {
              const entries = record.attendance_entries ?? [];
              const present = entries.filter((e: any) => e.status === 'present').length;
              const total = entries.length;
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;

              return (
                <div key={record.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {record.classes?.name}
                      {record.classes?.section ? ` (${record.classes.section})` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Taken by {record.profiles?.first_name} {record.profiles?.last_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{present}/{total}</p>
                      <p className="text-xs text-muted-foreground">present</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${rate >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : rate >= 75 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {rate}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
