import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { FinanceOverviewCharts } from '@/components/finance/FinanceOverviewCharts';
import { RecentPaymentsTable } from '@/components/finance/RecentPaymentsTable';
import { DefaultersList } from '@/components/finance/DefaultersList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Finance' };

export default async function FinancePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');
  if (!['super_admin', 'school_admin'].includes(profile.role)) redirect('/dashboard/home');

  // Get current term
  const { data: currentTerm } = await supabase
    .from('terms')
    .select('id, name, academic_years(name)')
    .eq('school_id', profile.school_id)
    .eq('is_current', true)
    .single();

  const termId = currentTerm?.id;

  const [invoicesData, paymentsData, defaultersData] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_amount, amount_paid, balance, status')
      .eq('school_id', profile.school_id)
      .eq('term_id', termId ?? ''),

    supabase
      .from('payments')
      .select(`
        id, receipt_number, amount, payment_date, payment_method,
        students(first_name, last_name, student_id, classes(name))
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('invoices')
      .select(`
        id, invoice_number, total_amount, amount_paid, balance, due_date, status,
        students(id, first_name, last_name, student_id, classes(name))
      `)
      .eq('school_id', profile.school_id)
      .eq('term_id', termId ?? '')
      .in('status', ['unpaid', 'overdue', 'partial'])
      .order('balance', { ascending: false })
      .limit(10),
  ]);

  const invoices = invoicesData.data ?? [];
  const totalExpected = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.balance ?? 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').length;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  const fmtGHS = (n: number) =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(n);

  const statCards = [
    {
      label: 'Total Expected',
      value: fmtGHS(totalExpected),
      sub: `${currentTerm?.name ?? 'Current term'}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Collected',
      value: fmtGHS(totalCollected),
      sub: `${collectionRate.toFixed(1)}% collection rate`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      trend: 'up',
    },
    {
      label: 'Outstanding',
      value: fmtGHS(totalOutstanding),
      sub: `From ${invoices.filter(i => i.balance > 0).length} invoices`,
      icon: TrendingDown,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Overdue',
      value: totalOverdue.toString(),
      sub: 'Invoices past due date',
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-description">
            {currentTerm?.name} · {(currentTerm?.academic_years as any)?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/dashboard/finance/invoices/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
          <Link
            href="/dashboard/finance/payments/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            Record Payment
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className={`p-2 rounded-lg ${card.bg} w-fit`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <div className="stat-label">{card.label}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collection progress */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Fee Collection Progress</h3>
            <p className="text-xs text-muted-foreground">{currentTerm?.name}</p>
          </div>
          <span className="text-lg font-bold text-foreground">{collectionRate.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(collectionRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{fmtGHS(totalCollected)} collected</span>
          <span>{fmtGHS(totalExpected)} expected</span>
        </div>
      </div>

      {/* Charts */}
      <FinanceOverviewCharts schoolId={profile.school_id} />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPaymentsTable payments={paymentsData.data ?? []} />
        <DefaultersList defaulters={defaultersData.data ?? []} />
      </div>
    </div>
  );
}
