
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface ExpensesChartProps {
  title: string;
  description: string;
  data: { category: string; total: number }[];
  totalValue: number;
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

const renderLegend = (props: any, totalValue: number) => {
  const { payload } = props;

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3">
      {payload.map((entry: any, index: number) => {
        const percentage = totalValue > 0 ? (entry.payload.value / totalValue) * 100 : 0;
        return (
            <li key={`item-${index}`} className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-muted-foreground">{entry.value}</span>
                <span className="text-sm font-semibold">{formatCurrency(entry.payload.value)}</span>
                <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
            </li>
        )
      })}
    </ul>
  );
};


export function ExpensesChart({ title, description, data, totalValue }: ExpensesChartProps) {
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-[#1d2630] col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
        <p className="text-2xl font-bold pt-2">Total: {formatCurrency(totalValue)}</p>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="category"
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={(props) => renderLegend(props, totalValue)} wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
