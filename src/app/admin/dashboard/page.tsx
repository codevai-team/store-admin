'use client';

import { useEffect, useState } from 'react';
import { 
  CubeIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/dashboard/StatCard';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import OrderStatusChart from '@/components/admin/dashboard/OrderStatusChart';
import TopProductsChart from '@/components/admin/dashboard/TopProductsChart';
import RecentOrders from '@/components/admin/dashboard/RecentOrders';

interface DashboardData {
  overview: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    revenueChange: number;
    ordersChange: number;
    productsChange: number;
  };
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
    topProducts: Array<{ name: string; sold: number; revenue: number }>;
    categories: Array<{ name: string; products: number; orders: number; revenue: number }>;
    orderStatus: Array<{ status: string; count: number; revenue: number }>;
    dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalPrice: number;
    status: string;
    createdAt: string;
    itemsCount: number;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">Ошибка загрузки данных: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <h1 className="text-3xl font-bold text-white mb-2">
            Панель управления
          </h1>
          <p className="text-gray-300">
            Полная аналитика и управление вашим интернет-магазином
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Общий доход"
            value={formatCurrency(data.overview.totalRevenue)}
            change={data.overview.revenueChange}
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            color="green"
            trend="up"
          />
          <StatCard
            title="Всего заказов"
            value={data.overview.totalOrders}
            change={data.overview.ordersChange}
            icon={<ShoppingBagIcon className="h-6 w-6" />}
            color="blue"
            trend="up"
          />
          <StatCard
            title="Активных товаров"
            value={data.overview.totalProducts}
            change={data.overview.productsChange}
            icon={<CubeIcon className="h-6 w-6" />}
            color="purple"
            trend="up"
          />
          <StatCard
            title="Ожидают обработки"
            value={data.overview.pendingOrders}
            icon={<ClockIcon className="h-6 w-6" />}
            color="yellow"
            trend="neutral"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={data.charts.monthlyRevenue} />
          <OrderStatusChart data={data.charts.orderStatus} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsChart data={data.charts.topProducts} />
          
          {/* Daily Performance */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Сегодня</h3>
                <p className="text-sm text-gray-400">Показатели дня</p>
              </div>
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300 font-medium">Новые заказы</span>
                <span className="text-white font-bold text-xl">
                  {data.charts.dailyOrders.length > 0 ? data.charts.dailyOrders[data.charts.dailyOrders.length - 1].orders : 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300 font-medium">Доход за день</span>
                <span className="text-white font-bold text-xl">
                  {data.charts.dailyOrders.length > 0 ? formatCurrency(data.charts.dailyOrders[data.charts.dailyOrders.length - 1].revenue) : '₽0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Categories */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Топ категории</h3>
                <p className="text-sm text-gray-400">По количеству товаров</p>
              </div>
            </div>
            <div className="space-y-4">
              {data.charts.categories.slice(0, 3).map((category, index) => (
                <div key={category.name} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300 font-medium">{category.name}</span>
                  </div>
                  <span className="text-white font-bold">{category.products}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders - растянуто на 2 колонки */}
          <div className="lg:col-span-2">
            <RecentOrders orders={data.recentOrders} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}