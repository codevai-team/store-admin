'use client';

import { ChartBarIcon } from '@heroicons/react/24/outline';

interface CategoryData {
  name: string;
  products: number;
  orders: number;
  revenue: number;
}

interface TopCategoriesChartProps {
  data: CategoryData[];
}

export default function TopCategoriesChart({ data }: TopCategoriesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Топ категории</h3>
          <p className="text-sm text-gray-400">По количеству товаров</p>
        </div>
        <ChartBarIcon className="h-6 w-6 text-purple-400" />
      </div>
      
      <div className="space-y-4">
        {data.length > 0 ? (
          data.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full text-white font-bold text-xs">
                  {index + 1}
                </div>
                <span className="text-gray-300 font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{category.products}</div>
                <div className="text-xs text-gray-400">Стоимость: {formatCurrency(category.revenue)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Нет данных о категориях</p>
          </div>
        )}
      </div>
    </div>
  );
}
