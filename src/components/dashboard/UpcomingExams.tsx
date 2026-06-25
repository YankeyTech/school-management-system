'use client';

import { FileText, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Exam {
  id: string;
  name: string;
  start_datetime: string;
  status: string;
  subjects: { name: string } | null;
  classes: { name: string } | null;
}

export function UpcomingExams({ exams }: { exams: Exam[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Upcoming Exams</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Scheduled assessments</p>
        </div>
        <Link
          href="/dashboard/exams"
          className="text-xs text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming exams</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const examDate = new Date(exam.start_datetime);
            const isToday = examDate.toDateString() === new Date().toDateString();
            const isTomorrow =
              examDate.toDateString() ===
              new Date(Date.now() + 86400000).toDateString();

            return (
              <Link
                key={exam.id}
                href={`/dashboard/exams/${exam.id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="mt-0.5 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {exam.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {exam.subjects?.name} · {exam.classes?.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? 'text-red-600'
                          : isTomorrow
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isToday
                        ? 'Today'
                        : isTomorrow
                        ? 'Tomorrow'
                        : formatDistanceToNow(examDate, { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {examDate.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {isToday && (
                  <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 rounded-full">
                    TODAY
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
