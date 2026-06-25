'use client';

import { TrendingUp, TrendingDown, Users, GraduationCap, School, FileText, DollarSign, BookCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsData {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  upcomingExams: number;
  totalFees: number;
  totalCollected: number;
  collectionRate: number;
}

interface DashboardStatsProps {
  stats: StatsData;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      label: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      sub: `${stats.activeStudents} active`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      trend: null,
    },
    {
      label: 'Teaching Staff',
      value: stats.totalTeachers.toLocaleString(),
      sub: `${stats.activeTeachers} active`,
      icon: GraduationCap,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      trend: null,
    },
    {
      label: 'Active Classes',
      value: stats.totalClasses.toLocaleString(),
      sub: 'This academic year',
      icon: School,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      trend: null,
    },
    {
      label: 'Upcoming Exams',
      value: stats.upcomingExams.toLocaleString(),
      sub: 'Scheduled exams',
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      trend: null,
    },
    {
      label: 'Fees Expected',
      value: `₵${(stats.totalFees / 1000).toFixed(1)}k`,
      sub: `₵${(stats.totalCollected / 1000).toFixed(1)}k collected`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      trend: { value: stats.collectionRate, label: 'collection rate', up: stats.collectionRate >= 70 },
    },
    {
      label: 'Collection Rate',
      value: `${stats.collectionRate}%`,
      sub: stats.collectionRate >= 70 ? 'On target' : 'Needs attention',
      icon: BookCheck,
      color: stats.collectionRate >= 70 
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      bg: stats.collectionRate >= 70
        ? 'bg-emerald-100 dark:bg-emerald-900/30'
        : 'bg-red-100 dark:bg-red-900/30',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div className={cn('p-2 rounded-lg', card.bg)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
          </div>
          <div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            {card.sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            )}
          </div>
          {card.trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                card.trend.up ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {card.trend.up ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {card.trend.value}% {card.trend.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
