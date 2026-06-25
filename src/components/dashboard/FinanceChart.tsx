'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FinanceChartProps {
  totalFees: number;
  totalCollected: number;
  collectionRate: number;
}

export function FinanceChart({ totalFees, totalCollected, collectionRate }: FinanceChartProps) {
  const outstanding = totalFees - totalCollected;

  const data = [
    { name: 'Collected', value: totalCollected, color: '#10B981' },
    { name: 'Outstanding', value: outstanding, color: '#F87171' },
  ];

  const formatCurrency = (val: number) =>
    `₵${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)}`;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Fee Collection</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Current term</p>
      </div>

      {/* Donut chart */}
      <div className="relative flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{collectionRate}%</span>
          <span className="text-xs text-muted-foreground">collected</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
          <span className="text-muted-foreground font-medium">Total Expected</span>
          <span className="font-semibold text-foreground">{formatCurrency(totalFees)}</span>
        </div>
      </div>
    </div>
  );
}
