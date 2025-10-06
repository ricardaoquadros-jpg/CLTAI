
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface MonthlyExpensesChartProps {
  data: { category: string; total: number }[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#FF5733', '#C70039', '#900C3F', '#581845', '#A2D9CE',
  '#F7DC6F', '#E74C3C'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {data.name}
            </span>
            <span className="font-bold text-muted-foreground">
              {formatCurrency(data.value)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function MonthlyExpensesChart({ data }: MonthlyExpensesChartProps) {
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-[#1d2630] col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Despesas do Mês por Categoria</CardTitle>
        <CardDescription>
          Uma visão detalhada de onde seu dinheiro foi este mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="category"
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
