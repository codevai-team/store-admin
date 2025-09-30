'use client';

import { TruckIcon, StarIcon } from '@heroicons/react/24/outline';

interface CourierPerformanceData {
  name: string;
  delivered: number;
  revenue: number;
  rating: number;
}

interface CourierPerformanceChartProps {
  data: CourierPerformanceData[];
}

export default function CourierPerformanceChart({ data }: CourierPerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-400';
    if (rating >= 4.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Производительность курьеров</h3>
          <p className="text-sm text-gray-400">Топ курьеры по доставкам</p>
        </div>
        <TruckIcon className="h-6 w-6 text-green-400" />
      </div>
      
      <div className="space-y-4">
        {data.map((courier, index) => (
          <div key={courier.name} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full text-white font-bold text-sm">
                {index + 1}
              </div>
              <div>
                <div className="text-white font-medium">{courier.name}</div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <StarIcon className="h-4 w-4" />
                  <span className={getRatingColor(courier.rating)}>
                    {courier.rating}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">{courier.delivered} доставок</div>
              <div className="text-sm text-gray-400">
                {formatCurrency(courier.revenue)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
