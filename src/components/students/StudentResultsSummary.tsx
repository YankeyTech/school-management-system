'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  studentId: string;
  schoolId: string;
}

interface Result {
  id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  exams: { name: string; subjects: { name: string } | null } | null;
}

export function StudentResultsSummary({ studentId, schoolId }: Props) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('exam_results')
        .select(`
          id, marks_obtained, total_marks, percentage, grade,
          exams(name, subjects(name))
        `)
        .eq('student_id', studentId)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(6);

      setResults(data ?? []);
      setLoading(false);
    }
    load();
  }, [studentId, schoolId]);

  const gradeColor = (grade: string) => {
    if (['A1', 'B2', 'B3'].includes(grade)) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
    if (['C4', 'C5', 'C6'].includes(grade)) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">Recent Results</h3>
        <a
          href={`/dashboard/results?student_id=${studentId}`}
          className="text-xs text-primary hover:underline font-medium"
        >
          View all
        </a>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 shimmer rounded-lg" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <BookOpen className="h-7 w-7 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No results recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {r.exams?.subjects?.name ?? 'Unknown Subject'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.exams?.name}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-24 hidden sm:block">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      r.percentage >= 70
                        ? 'bg-emerald-500'
                        : r.percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(r.percentage, 100)}%` }}
                  />
                </div>
              </div>

              <span className="text-xs text-muted-foreground w-12 text-right">
                {r.marks_obtained}/{r.total_marks}
              </span>

              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0',
                  gradeColor(r.grade)
                )}
              >
                {r.grade}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
