'use client';

import { TruckIcon } from '@heroicons/react/24/outline';

interface CourierPerformanceData {
  name: string;
  delivered: number;
  revenue: number;
}

interface CourierPerformanceChartProps {
  data: CourierPerformanceData[];
  periodLabel?: string;
}

export default function CourierPerformanceChart({ data, periodLabel }: CourierPerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(value) + ' ⃀';
  };


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Производительность курьеров</h3>
          <p className="text-sm text-gray-400">
            Топ-3 курьера по доставкам{periodLabel ? ` (${periodLabel})` : ''}
          </p>
        </div>
        <TruckIcon className="h-6 w-6 text-green-400" />
      </div>
      
      <div className="space-y-4">
        {data.length > 0 ? (
          data.map((courier, index) => (
            <div key={courier.name} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="text-white font-medium">{courier.name}</div>
                  <div className="text-sm text-gray-400">
                    Курьер
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
          ))
        ) : (
          <div className="text-center py-8">
            <TruckIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Нет курьеров в системе</p>
          </div>
        )}
      </div>
    </div>
  );
}
