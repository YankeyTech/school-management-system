'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Mock monthly collection data — replace with real Supabase aggregation
const monthlyData = [
  { month: 'Jan', expected: 48000, collected: 40000 },
  { month: 'Feb', expected: 52000, collected: 48000 },
  { month: 'Mar', expected: 50000, collected: 45000 },
  { month: 'Apr', expected: 55000, collected: 52000 },
  { month: 'May', expected: 48000, collected: 38000 },
  { month: 'Jun', expected: 60000, collected: 55000 },
];

const fmtK = (v: number) => `₵${(v / 1000).toFixed(0)}k`;

export function FinanceOverviewCharts({ schoolId }: { schoolId: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Monthly Collection vs Expected</h3>
          <p className="text-xs text-muted-foreground mt-0.5">2024/2025 Academic Year</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-200 dark:bg-blue-900" />
            Expected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            Collected
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={monthlyData} barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => fmtK(value)}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Bar dataKey="expected" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Expected" />
          <Bar dataKey="collected" fill="#10B981" radius={[4, 4, 0, 0]} name="Collected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
