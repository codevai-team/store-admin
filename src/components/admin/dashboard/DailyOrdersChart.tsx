'use client';

import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface DailyOrdersData {
  date: string;
  orders: number;
  revenue: number;
}

interface DailyOrdersChartProps {
  data: DailyOrdersData[];
}

export default function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const maxOrders = Math.max(...data.map(d => d.orders));
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  // Вычисляем тренд
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.orders, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.orders, 0) / secondHalf.length;
  
  const trend = secondHalfAvg > firstHalfAvg ? 'up' : 'down';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Дневная статистика</h3>
          <p className="text-sm text-gray-400">Заказы и выручка по дням</p>
        </div>
        <div className="flex items-center space-x-2">
          {trend === 'up' ? (
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
          ) : (
            <ArrowTrendingDownIcon className="h-5 w-5 text-red-400" />
          )}
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? 'Рост' : 'Спад'}
          </span>
        </div>
      </div>

      {/* График заказов */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Заказы</h4>
          <span className="text-gray-400 text-sm">За последние 7 дней</span>
        </div>
        <div className="flex items-end space-x-2 h-32">
          {data.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                style={{ 
                  height: `${(day.orders / maxOrders) * 100}%`,
                  minHeight: '4px'
                }}
                title={`${day.date}: ${day.orders} заказов`}
              ></div>
              <div className="text-xs text-gray-400 mt-2">{day.date}</div>
              <div className="text-xs text-white font-medium mt-1">{day.orders}</div>
            </div>
          ))}
        </div>
      </div>

      {/* График выручки */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Выручка</h4>
          <span className="text-gray-400 text-sm">За последние 7 дней</span>
        </div>
        <div className="flex items-end space-x-2 h-32">
          {data.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                style={{ 
                  height: `${(day.revenue / maxRevenue) * 100}%`,
                  minHeight: '4px'
                }}
                title={`${day.date}: ${formatCurrency(day.revenue)}`}
              ></div>
              <div className="text-xs text-gray-400 mt-2">{day.date}</div>
              <div className="text-xs text-white font-medium mt-1">
                {formatCurrency(day.revenue).replace('₽', '₽').replace(/\s/g, '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Итоговая статистика */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Всего заказов</div>
          <div className="text-white font-bold text-xl">
            {data.reduce((sum, d) => sum + d.orders, 0)}
          </div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Общая выручка</div>
          <div className="text-white font-bold text-lg">
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
