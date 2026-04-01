'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import {
  getFinanceEntries,
  aggregateByMonth,
  aggregateRevenueByStream,
  type MonthlyFinanceSummary,
  type StreamSummary,
} from '@/utils/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const YTW_COLORS = {
  revenue:  '#A55437', // terracotta
  expense:  '#C4A882', // sand
  profit:   '#6B8F6E', // sage
  yoga:     '#A55437',
  fnb:      '#C4A882',
  boutique: '#6B8F6E',
  other:    '#8B7B6E',
};

const STREAM_COLORS = [YTW_COLORS.yoga, YTW_COLORS.fnb, YTW_COLORS.boutique, YTW_COLORS.other];

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatMonth(month: string) {
  const [year, m] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${year}`;
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardCharts() {
  const { currentTenant } = useTenant();
  const [monthly, setMonthly] = useState<MonthlyFinanceSummary[]>([]);
  const [streams, setStreams] = useState<StreamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTenant) return;

    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const entries = await getFinanceEntries(supabase, currentTenant.id);
      setMonthly(aggregateByMonth(entries));
      setStreams(aggregateRevenueByStream(entries));
      setLoading(false);
    };

    load();
  }, [currentTenant]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (monthly.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground text-sm">
          No finance data yet. Run <code className="font-mono bg-muted px-1 rounded">finance_schema.sql</code> and add entries to get started.
        </CardContent>
      </Card>
    );
  }

  // KPI totals across all months
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const totalProfit  = totalRevenue - totalExpense;
  const margin       = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const chartData = monthly.map(m => ({ ...m, month: formatMonth(m.month) }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} />
        <KpiCard title="Total Expenses" value={formatCurrency(totalExpense)} />
        <KpiCard
          title="Net Profit"
          value={formatCurrency(totalProfit)}
          subtitle={`${margin}% margin`}
        />
      </div>

      {/* Revenue vs Expenses bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill={YTW_COLORS.revenue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill={YTW_COLORS.expense} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* P&L trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke={YTW_COLORS.profit}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by stream donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Stream</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={streams}
                  dataKey="revenue"
                  nameKey="stream"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  label={({ stream, percent }) => `${stream} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {streams.map((_, index) => (
                    <Cell key={index} fill={STREAM_COLORS[index % STREAM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
