'use client';

import Link from 'next/link';
import {
  UserPlus,
  ClipboardCheck,
  FileText,
  DollarSign,
  BookOpen,
  Sparkles,
  Bell,
  BarChart3,
} from 'lucide-react';

interface Action {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  roles: string[];
}

const QUICK_ACTIONS: Action[] = [
  {
    label: 'Add Student',
    href: '/dashboard/students/new',
    icon: UserPlus,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    roles: ['school_admin', 'super_admin'],
  },
  {
    label: 'Take Attendance',
    href: '/dashboard/attendance/take',
    icon: ClipboardCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    roles: ['teacher', 'school_admin', 'super_admin'],
  },
  {
    label: 'Create Exam',
    href: '/dashboard/exams/new',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    roles: ['teacher', 'school_admin', 'super_admin'],
  },
  {
    label: 'Record Payment',
    href: '/dashboard/finance/payments/new',
    icon: DollarSign,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    roles: ['school_admin', 'super_admin'],
  },
  {
    label: 'Enter Results',
    href: '/dashboard/results/enter',
    icon: BookOpen,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    roles: ['teacher', 'school_admin', 'super_admin'],
  },
  {
    label: 'AI Assistant',
    href: '/dashboard/ai-assistant',
    icon: Sparkles,
    color: 'text-pink-600',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    roles: ['teacher', 'school_admin', 'super_admin', 'student'],
  },
  {
    label: 'Send Notice',
    href: '/dashboard/announcements/new',
    icon: Bell,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    roles: ['teacher', 'school_admin', 'super_admin'],
  },
  {
    label: 'View Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    roles: ['school_admin', 'super_admin'],
  },
];

export function QuickActions({ role }: { role: string }) {
  const actions = QUICK_ACTIONS.filter((a) => a.roles.includes(role));

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2.5 p-3.5 bg-card border border-border rounded-xl 
                       hover:shadow-sm hover:border-border/80 transition-all duration-150 group text-center"
          >
            <div className={`p-2.5 rounded-lg ${action.bg} group-hover:scale-110 transition-transform`}>
              <action.icon className={`h-4 w-4 ${action.color}`} />
            </div>
            <span className="text-xs font-medium text-foreground leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
