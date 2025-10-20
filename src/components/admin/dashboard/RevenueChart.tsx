'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
  canceledRevenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(value) + ' с.';
  };

  // Проверяем, есть ли хоть какие-то данные (даже с нулевыми значениями)
  const hasAnyRevenue = data && data.some(item => item.revenue > 0 || item.canceledRevenue > 0);

  // Если данных нет, показываем сообщение
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Динамика доходов</h3>
            <p className="text-sm text-gray-400">Доходы и отмененные заказы</p>
          </div>
        </div>
        
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg">Нет данных за выбранный период</p>
            <p className="text-gray-500 text-sm mt-2">Выберите другой период или добавьте заказы</p>
          </div>
        </div>
      </div>
    );
  }

  // Если данные есть, но все доходы равны 0, показываем график с сообщением
  if (!hasAnyRevenue) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Динамика доходов</h3>
            <p className="text-sm text-gray-400">Доходы и отмененные заказы</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Доходы</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Отмененные</span>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={formatCurrency}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [formatCurrency(value), 'Доход'];
                  if (name === 'canceledRevenue') return [formatCurrency(value), 'Отмененные'];
                  return [value, 'Заказы'];
                }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue"
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                name="Доходы"
              />
              <Line 
                type="monotone" 
                dataKey="canceledRevenue"
                stroke="#EF4444" 
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                name="Отмененные"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-yellow-400 text-sm">📊 За выбранный период доходы равны 0</p>
          <p className="text-gray-500 text-xs mt-1">Проверьте статус заказов или выберите другой период</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Динамика доходов</h3>
          <p className="text-sm text-gray-400">Доходы и отмененные заказы</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Доходы</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Отмененные</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatCurrency}
              domain={[0, 'dataMax']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [formatCurrency(value), 'Доход'];
                if (name === 'canceledRevenue') return [formatCurrency(value), 'Отмененные'];
                return [value, 'Заказы'];
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue"
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              name="Доходы"
            />
            <Line 
              type="monotone" 
              dataKey="canceledRevenue"
              stroke="#EF4444" 
              strokeWidth={3}
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
              name="Отмененные"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
