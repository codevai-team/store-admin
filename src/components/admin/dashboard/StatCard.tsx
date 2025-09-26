'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, change, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    red: 'text-red-400'
  };

  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${colorClasses[color]} border`}>
              <div className={iconColorClasses[color]}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">{title}</p>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
          </div>
        </div>
        
        {change !== undefined && (
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${trendColor}`}>
              <span className="text-sm font-medium">{trendIcon}</span>
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs прошлый месяц</p>
          </div>
        )}
      </div>
    </div>
  );
}
