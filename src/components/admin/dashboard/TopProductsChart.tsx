'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopProductData {
  name: string;
  sold: number;
  revenue: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
}

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Обрезаем длинные названия
  const formattedData = data.map(item => ({
    ...item,
    shortName: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
  }));

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Топ товары</h3>
          <p className="text-sm text-gray-400">Самые продаваемые за месяц</p>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="shortName" 
              stroke="#9CA3AF"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number, name: string) => [
                name === 'sold' ? `${value} шт.` : formatCurrency(value),
                name === 'sold' ? 'Продано' : 'Доход'
              ]}
              labelFormatter={(label) => {
                const item = formattedData.find(d => d.shortName === label);
                return item ? item.name : label;
              }}
            />
            <Bar 
              dataKey="sold" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
