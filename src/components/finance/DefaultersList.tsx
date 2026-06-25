'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Defaulter {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: string;
  students: {
    id: string;
    first_name: string;
    last_name: string;
    student_id: string;
    classes: { name: string } | null;
  } | null;
}

export function DefaultersList({ defaulters }: { defaulters: Defaulter[] }) {
  const isOverdue = (due: string) => new Date(due) < new Date();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Outstanding Balances</h3>
          <p className="text-xs text-muted-foreground">Students with unpaid fees</p>
        </div>
        <Link
          href="/dashboard/finance/invoices?status=unpaid"
          className="text-xs text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-border">
        {defaulters.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <AlertCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-foreground">All fees paid!</p>
            <p className="text-xs text-muted-foreground">No outstanding balances</p>
          </div>
        ) : (
          defaulters.map((d) => {
            const overdue = isOverdue(d.due_date);
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  overdue
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                )}>
                  {d.students?.first_name[0]}{d.students?.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/students/${d.students?.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary truncate block transition-colors"
                  >
                    {d.students?.first_name} {d.students?.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {d.students?.classes?.name} · {d.students?.student_id}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    'text-sm font-semibold',
                    overdue ? 'text-red-600' : 'text-amber-600'
                  )}>
                    ₵{d.balance.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </p>
                  {overdue && (
                    <p className="text-[10px] text-red-500 font-medium">OVERDUE</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
