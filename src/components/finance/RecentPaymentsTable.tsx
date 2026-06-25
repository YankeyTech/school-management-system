'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  cash: { label: 'Cash', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  mobile_money: { label: 'MoMo', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  bank_transfer: { label: 'Bank', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  card: { label: 'Card', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  cheque: { label: 'Cheque', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

interface Payment {
  id: string;
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  students: {
    first_name: string;
    last_name: string;
    student_id: string;
    classes: { name: string } | null;
  } | null;
}

export function RecentPaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Recent Payments</h3>
          <p className="text-xs text-muted-foreground">Latest transactions</p>
        </div>
        <Link
          href="/dashboard/finance/payments"
          className="text-xs text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-border">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No payments recorded</p>
        ) : (
          payments.map((p) => {
            const method = METHOD_LABELS[p.payment_method] ?? {
              label: p.payment_method,
              color: 'bg-gray-100 text-gray-700',
            };
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.students
                      ? `${p.students.first_name} ${p.students.last_name}`
                      : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.receipt_number} ·{' '}
                    {formatDistanceToNow(new Date(p.payment_date), { addSuffix: true })}
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', method.color)}>
                  {method.label}
                </span>
                <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                  +₵{p.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
