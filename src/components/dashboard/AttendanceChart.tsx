'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Mock data for 4 weeks - will be replaced by real Supabase data
const mockData = [
  { day: 'Mon', present: 312, absent: 18, late: 12 },
  { day: 'Tue', present: 298, absent: 32, late: 12 },
  { day: 'Wed', present: 325, absent: 15, late: 2 },
  { day: 'Thu', present: 310, absent: 24, late: 8 },
  { day: 'Fri', present: 280, absent: 55, late: 7 },
  { day: 'Mon', present: 318, absent: 22, late: 2 },
  { day: 'Tue', present: 305, absent: 28, late: 9 },
  { day: 'Wed', present: 330, absent: 10, late: 2 },
  { day: 'Thu', present: 315, absent: 20, late: 7 },
  { day: 'Fri', present: 290, absent: 45, late: 7 },
];

interface AttendanceChartProps {
  schoolId: string;
}

export function AttendanceChart({ schoolId }: AttendanceChartProps) {
  const [data, setData] = useState(mockData);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Attendance Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 2 weeks — daily breakdown</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Absent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Late
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F87171" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Area
            type="monotone"
            dataKey="present"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#presentGrad)"
            name="Present"
          />
          <Area
            type="monotone"
            dataKey="absent"
            stroke="#F87171"
            strokeWidth={2}
            fill="url(#absentGrad)"
            name="Absent"
          />
          <Area
            type="monotone"
            dataKey="late"
            stroke="#FBBF24"
            strokeWidth={2}
            fill="none"
            name="Late"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
