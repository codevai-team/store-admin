'use client';

import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface DailyOrdersData {
  date: string;
  orders: number;
  deliveredOrders?: number; // Делаем опциональным
  revenue: number;
}

interface DailyOrdersChartProps {
  data: DailyOrdersData[];
  periodLabel?: string; // Добавляем опциональный параметр для описания периода
}

export default function DailyOrdersChart({ data, periodLabel }: DailyOrdersChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(value) + ' ⃀';
  };

  const maxOrders = Math.max(...data.map(d => d.orders));
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  

  // Определяем описание периода
  const getPeriodDescription = () => {
    if (periodLabel) return periodLabel;
    
    const dayCount = data.length;
    if (dayCount <= 1) return 'За день';
    if (dayCount <= 7) return `За ${dayCount} дн.`;
    if (dayCount <= 31) return `За ${dayCount} дн.`;
    if (dayCount <= 90) return `За ${dayCount} дн.`;
    return `За ${dayCount} дн.`;
  };

  // Вычисляем тренд: сравниваем среднее количество заказов в первой и второй половине периода
  // Логика: делим данные пополам, считаем среднее для каждой половины
  // Если среднее во второй половине больше - "Рост", иначе - "Спад"
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.orders, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.orders, 0) / secondHalf.length;
  
  const trend = secondHalfAvg > firstHalfAvg ? 'up' : 'down';

  // Подсчитываем общее количество заказов и доставленных заказов
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalDelivered = data.reduce((sum, d) => sum + (d.deliveredOrders || 0), 0);

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
        <h4 className="text-white font-medium">Заказы ({data.length} дн.)</h4>
        <span className="text-gray-400 text-sm">{getPeriodDescription()}</span>
      </div>
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-end space-x-2 h-32" style={{ minWidth: `${Math.max(data.length * 60, 400)}px` }}>
            {data.map((day) => (
              <div key={day.date} className="flex flex-col items-center" style={{ minWidth: '50px' }}>
                <div 
                  className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                  style={{ 
                    height: maxOrders > 0 ? `${Math.max((day.orders / maxOrders) * 120, 4)}px` : '4px',
                    width: '40px'
                  }}
                  title={`${day.date}: ${day.orders} заказов`}
                ></div>
                <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-center">{day.date}</div>
                <div className="text-xs text-white font-medium mt-1">{day.orders}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* График выручки */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Выручка ({data.length} дн.)</h4>
          <span className="text-gray-400 text-sm">{getPeriodDescription()}</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-end space-x-2 h-32" style={{ minWidth: `${Math.max(data.length * 60, 400)}px` }}>
            {data.map((day) => (
              <div key={day.date} className="flex flex-col items-center" style={{ minWidth: '50px' }}>
                <div 
                  className="bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                  style={{ 
                    height: maxRevenue > 0 ? `${Math.max((day.revenue / maxRevenue) * 120, 4)}px` : '4px',
                    width: '40px'
                  }}
                  title={`${day.date}: ${formatCurrency(day.revenue)}`}
                ></div>
                <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-center">{day.date}</div>
                <div className="text-xs text-white font-medium mt-1">
                  {formatCurrency(day.revenue).replace(/\s/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Итоговая статистика */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Всего заказов</div>
          <div className="text-white font-bold text-xl">
            {totalOrders}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            Продано: {totalDelivered} шт.
          </div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Общая выручка</div>
          <div className="text-white font-bold text-lg">
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            Только доставленные
          </div>
        </div>
      </div>
    </div>
  );
}
