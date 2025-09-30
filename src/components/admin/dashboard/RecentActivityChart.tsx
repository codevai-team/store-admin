'use client';

import { 
  ClockIcon,
  ShoppingBagIcon,
  CubeIcon,
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface RecentActivityData {
  type: string;
  message: string;
  time: string;
}

interface RecentActivityChartProps {
  data: RecentActivityData[];
}

export default function RecentActivityChart({ data }: RecentActivityChartProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBagIcon className="h-5 w-5" />;
      case 'product':
        return <CubeIcon className="h-5 w-5" />;
      case 'user':
        return <UserIcon className="h-5 w-5" />;
      case 'delivery':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-400 bg-blue-500/20';
      case 'product':
        return 'text-green-400 bg-green-500/20';
      case 'user':
        return 'text-purple-400 bg-purple-500/20';
      case 'delivery':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Последняя активность</h3>
          <p className="text-sm text-gray-400">События в реальном времени</p>
        </div>
        <ClockIcon className="h-6 w-6 text-blue-400" />
      </div>
      
      <div className="space-y-4">
        {data.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/30 rounded-lg">
            <div className={`p-2 rounded-lg ${getColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{activity.message}</p>
              <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
