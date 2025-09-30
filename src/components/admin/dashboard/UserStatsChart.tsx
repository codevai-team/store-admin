'use client';

import { 
  UserGroupIcon, 
  UserIcon, 
  TruckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface UserStatsData {
  role: string;
  count: number;
  active: number;
}

interface UserStatsChartProps {
  data: UserStatsData[];
}

export default function UserStatsChart({ data }: UserStatsChartProps) {
  const getIcon = (role: string) => {
    switch (role) {
      case 'Продавцы':
        return <UserIcon className="h-5 w-5" />;
      case 'Курьеры':
        return <TruckIcon className="h-5 w-5" />;
      case 'Администраторы':
        return <ShieldCheckIcon className="h-5 w-5" />;
      default:
        return <UserGroupIcon className="h-5 w-5" />;
    }
  };

  const getColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Статистика пользователей</h3>
          <p className="text-sm text-gray-400">По ролям и активности</p>
        </div>
        <UserGroupIcon className="h-6 w-6 text-blue-400" />
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.role} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getColor(index)}`}>
                {getIcon(item.role)}
              </div>
              <div>
                <span className="text-gray-300 font-medium">{item.role}</span>
                <div className="text-xs text-gray-400">
                  Активных: {item.active} из {item.count}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">{item.count}</div>
              <div className="text-xs text-gray-400">
                Активных: {item.active}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
