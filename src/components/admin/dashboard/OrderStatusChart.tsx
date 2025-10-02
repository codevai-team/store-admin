'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface OrderStatusData {
  status: string;
  count: number;
  revenue: number;
}

interface LegendEntry {
  payload: OrderStatusData;
  value: string;
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function OrderStatusChart({ data }: OrderStatusChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(value) + ' с.';
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: OrderStatusData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-blue-400 font-medium">{data.status}</p>
          <p className="text-white">
            <span className="text-gray-400">Количество: </span>
            {data.count} заказов
          </p>
          <p className="text-white">
            <span className="text-gray-400">Сумма: </span>
            <span className="text-blue-400 font-semibold">{formatCurrency(data.revenue)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Статусы заказов</h3>
          <p className="text-sm text-gray-400">Распределение по статусам</p>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, count }) => `${status}: ${count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#F9FAFB', fontSize: '12px' }}
              formatter={(value, entry) => (entry as LegendEntry)?.payload?.status || value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
