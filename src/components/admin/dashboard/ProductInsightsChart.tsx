'use client';

import { 
  SwatchIcon, 
  TagIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface ProductInsightsData {
  totalColors: number;
  totalSizes: number;
  averagePrice: number;
  deliveryCancelRate: {
    delivered: number;
    canceled: number;
  };
  topSellingColors: Array<{
    color: string;
    count: number;
  }>;
  topSellingSizes: Array<{
    size: string;
    count: number;
  }>;
}

interface ProductInsightsChartProps {
  data: ProductInsightsData;
}

export default function ProductInsightsChart({ data }: ProductInsightsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(value) + ' ⃀';
  };

  const getColorForColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'Черный': 'bg-gray-800',
      'Белый': 'bg-gray-200',
      'Синий': 'bg-blue-500',
      'Красный': 'bg-red-500',
      'Зеленый': 'bg-green-500',
      'Желтый': 'bg-yellow-500',
      'Розовый': 'bg-pink-500',
      'Фиолетовый': 'bg-purple-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Аналитика товаров</h3>
          <p className="text-sm text-gray-400">Детальная статистика по товарам</p>
        </div>
        <ChartBarIcon className="h-6 w-6 text-purple-400" />
      </div>
      
      {/* Основные метрики */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <SwatchIcon className="h-5 w-5 text-blue-400" />
            <span className="text-gray-300 text-sm">Цвета</span>
          </div>
          <div className="text-white font-bold text-xl">{data.totalColors}</div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TagIcon className="h-5 w-5 text-green-400" />
            <span className="text-gray-300 text-sm">Размеры</span>
          </div>
          <div className="text-white font-bold text-xl">{data.totalSizes}</div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CurrencyDollarIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-gray-300 text-sm">Средняя цена</span>
          </div>
          <div className="text-white font-bold text-lg">{formatCurrency(data.averagePrice)}</div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <span className="text-gray-300 text-sm">Доставка/Отмена</span>
          </div>
          <div className="text-white font-bold text-lg">
            {data.deliveryCancelRate.delivered}% / {data.deliveryCancelRate.canceled}%
          </div>
        </div>
      </div>

      {/* Топ цвета */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Популярные цвета</h4>
        <div className="space-y-2">
          {data.topSellingColors.map((item, index) => (
            <div key={item.color} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getColorForColor(item.color)}`}></div>
                <span className="text-gray-300 text-sm">{item.color}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(item.count / 100) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white text-sm font-medium">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Топ размеры */}
      <div>
        <h4 className="text-white font-medium mb-3">Популярные размеры</h4>
        <div className="space-y-2">
          {data.topSellingSizes.map((item, index) => (
            <div key={item.size} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{item.size}</span>
                </div>
                <span className="text-gray-300 text-sm">Размер {item.size}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(item.count / 100) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white text-sm font-medium">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
