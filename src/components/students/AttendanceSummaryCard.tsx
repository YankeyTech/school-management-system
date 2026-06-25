'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalendarCheck, CalendarX, Clock, TrendingUp } from 'lucide-react';

interface Props {
  studentId: string;
  schoolId: string;
}

interface Summary {
  total_days: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  attendance_percentage: number;
}

export function AttendanceSummaryCard({ studentId, schoolId }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('class_attendance_summary')
        .select('*')
        .eq('student_id', studentId)
        .eq('school_id', schoolId)
        .limit(1)
        .maybeSingle();

      setSummary(data);
      setLoading(false);
    }
    load();
  }, [studentId, schoolId]);

  const rate = summary?.attendance_percentage ?? 0;
  const rateColor =
    rate >= 90
      ? 'text-emerald-600'
      : rate >= 75
      ? 'text-amber-600'
      : 'text-red-600';

  const ringColor =
    rate >= 90
      ? 'stroke-emerald-500'
      : rate >= 75
      ? 'stroke-amber-500'
      : 'stroke-red-500';

  const circumference = 2 * Math.PI * 30;
  const strokeDash = (rate / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4 text-sm">Attendance — This Term</h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 shimmer rounded-lg" />
          ))}
        </div>
      ) : !summary ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No attendance data recorded yet
        </p>
      ) : (
        <div className="flex items-center gap-6">
          {/* Ring chart */}
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="30"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="8"
              />
              <circle
                cx="40" cy="40" r="30"
                fill="none"
                className={ringColor}
                strokeWidth="8"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-sm font-bold ${rateColor}`}>{rate.toFixed(0)}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            <StatItem
              icon={CalendarCheck}
              label="Present"
              value={summary.days_present}
              color="text-emerald-600"
              bg="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <StatItem
              icon={CalendarX}
              label="Absent"
              value={summary.days_absent}
              color="text-red-600"
              bg="bg-red-100 dark:bg-red-900/30"
            />
            <StatItem
              icon={Clock}
              label="Late"
              value={summary.days_late}
              color="text-amber-600"
              bg="bg-amber-100 dark:bg-amber-900/30"
            />
            <StatItem
              icon={TrendingUp}
              label="Total Days"
              value={summary.total_days}
              color="text-blue-600"
              bg="bg-blue-100 dark:bg-blue-900/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${bg}`}>
        <Icon className={`h-3 w-3 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
