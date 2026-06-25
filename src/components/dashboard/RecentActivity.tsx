'use client';

import { DollarSign, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Payment {
  amount: number;
  payment_date: string;
  payment_method: string;
  students: { first_name: string; last_name: string } | null;
}

export function RecentActivity({ payments }: { payments: Payment[] }) {
  const methodLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    card: 'Card',
    cheque: 'Cheque',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Recent Payments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest fee collections</p>
        </div>
        <Link
          href="/dashboard/finance"
          className="text-xs text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No recent payments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {payment.students
                    ? `${payment.students.first_name} ${payment.students.last_name}`
                    : 'Unknown Student'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {methodLabels[payment.payment_method] ?? payment.payment_method} ·{' '}
                  {formatDistanceToNow(new Date(payment.payment_date), { addSuffix: true })}
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                +₵{payment.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/finance/payments"
        className="flex items-center justify-center gap-1.5 mt-4 text-xs text-primary hover:underline font-medium py-2"
      >
        View all payments
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
