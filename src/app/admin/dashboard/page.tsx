'use client';

import { useState, lazy, Suspense } from 'react';
import { 
  CubeIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/dashboard/StatCard';
import StatCardSkeleton from '@/components/admin/dashboard/StatCardSkeleton';
import LazyChartWrapper from '@/components/admin/dashboard/LazyChartWrapper';
import DateRangePicker, { DateRange } from '@/components/admin/dashboard/DateRangePicker';
import { useDashboardData } from '@/hooks/useDashboardData';

// Ленивая загрузка компонентов графиков
const RevenueChart = lazy(() => import('@/components/admin/dashboard/RevenueChart'));
const OrderStatusChart = lazy(() => import('@/components/admin/dashboard/OrderStatusChart'));
const TopProductsChart = lazy(() => import('@/components/admin/dashboard/TopProductsChart'));
const RecentOrders = lazy(() => import('@/components/admin/dashboard/RecentOrders'));
const UserStatsChart = lazy(() => import('@/components/admin/dashboard/UserStatsChart'));
const CourierPerformanceChart = lazy(() => import('@/components/admin/dashboard/CourierPerformanceChart'));
const ProductInsightsChart = lazy(() => import('@/components/admin/dashboard/ProductInsightsChart'));
const RecentActivityChart = lazy(() => import('@/components/admin/dashboard/RecentActivityChart'));
const DailyOrdersChart = lazy(() => import('@/components/admin/dashboard/DailyOrdersChart'));
const TopCategoriesChart = lazy(() => import('@/components/admin/dashboard/TopCategoriesChart'));

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState<DateRange>(() => {
    // Инициализируем с логикой "Неделя" (как на странице статистики)
    const now = new Date();
    
    // Получаем понедельник текущей недели
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
    
    // Получаем воскресенье текущей недели
    const sundayOffset = currentDay === 0 ? 0 : 7 - currentDay;
    const sunday = new Date(now.getTime() + sundayOffset * 24 * 60 * 60 * 1000);
    
    const startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
    const endDate = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999);
    
    return {
      startDate,
      endDate,
      label: 'Неделя',
      type: 'preset'
    };
  });

  const {
    overview,
    charts,
    recentOrders,
    loading,
    error,
    loadCharts,
    loadRecentOrders,
    refetch
  } = useDashboardData(selectedRange);

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(value) + ' с.';
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">Ошибка загрузки данных: {error}</p>
          <button 
            onClick={() => refetch.overview()}
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Панель управления
              </h1>
              <p className="text-gray-300">
                Полная аналитика и управление вашим интернет-магазином
              </p>
            </div>
            
            {/* Compact Date Range Picker */}
            <div className="lg:min-w-fit">
              <DateRangePicker 
                selectedRange={selectedRange}
                onRangeChange={handleRangeChange}
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Overview Stats - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading.overview || !overview ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Общий доход"
                value={formatCurrency(overview.totalRevenue)}
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
                color="green"
                trend="neutral"
              />
              <StatCard
                title="Всего заказов"
                value={overview.totalOrders}
                icon={<ShoppingBagIcon className="h-6 w-6" />}
                color="blue"
                trend="neutral"
              />
              <StatCard
                title="Активных товаров"
                value={overview.activeProducts}
                icon={<CubeIcon className="h-6 w-6" />}
                color="purple"
                trend="neutral"
              />
              <StatCard
                title="Ожидают обработки"
                value={overview.pendingOrders}
                icon={<ClockIcon className="h-6 w-6" />}
                color="yellow"
                trend="neutral"
              />
            </>
          )}
        </div>

        {/* Overview Stats - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading.overview || !overview ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Чистая выручка"
                value={formatCurrency(overview.netRevenue)}
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>}
                color="indigo"
                trend="neutral"
              />
              <StatCard
                title="Курьеры"
                value={overview.totalCouriers}
                icon={<ShoppingBagIcon className="h-6 w-6" />}
                color="green"
                trend="neutral"
              />
              <StatCard
                title="Продавцы"
                value={overview.totalSellers}
                icon={<UserGroupIcon className="h-6 w-6" />}
                color="blue"
                trend="neutral"
              />
              <StatCard
                title="Категории"
                value={overview.totalCategories}
                icon={<TagIcon className="h-6 w-6" />}
                color="purple"
                trend="neutral"
              />
            </>
          )}
        </div>


        {/* Charts Row 1 - Main Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.monthlyRevenue ? (
                <RevenueChart data={charts.monthlyRevenue} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка графика доходов...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
          
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.orderStatus ? (
                <OrderStatusChart data={charts.orderStatus} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка графика статусов...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
        </div>

        {/* Charts Row 2 - Products & Daily Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-96"></div>}>
              {charts?.topProducts ? (
                <TopProductsChart data={charts.topProducts} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-96 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка топ товаров...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
          
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-96"></div>}>
              {charts?.dailyOrders ? (
                <DailyOrdersChart 
                  data={charts.dailyOrders} 
                  periodLabel={selectedRange.label}
                />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-96 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка ежедневной статистики...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
        </div>

        {/* Charts Row 3 - User Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.userStats ? (
                <UserStatsChart data={charts.userStats} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка статистики пользователей...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
          
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.courierPerformance ? (
                <CourierPerformanceChart 
                  data={charts.courierPerformance} 
                  periodLabel={selectedRange.label}
                />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка статистики курьеров...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
        </div>

        {/* Charts Row 4 - Product Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.productInsights ? (
                <ProductInsightsChart data={charts.productInsights} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка аналитики товаров...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
          
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.recentActivity ? (
                <RecentActivityChart data={charts.recentActivity} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка последней активности...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>
        </div>

        {/* Charts Row 5 - Recent Orders & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Categories */}
          <LazyChartWrapper onVisible={loadCharts}>
            <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
              {charts?.categories ? (
                <TopCategoriesChart data={charts.categories} />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                  <div className="text-gray-400">Загрузка категорий...</div>
                </div>
              )}
            </Suspense>
          </LazyChartWrapper>

          {/* Recent Orders - растянуто на 2 колонки */}
          <div className="lg:col-span-2">
            <LazyChartWrapper onVisible={loadRecentOrders}>
              <Suspense fallback={<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse h-80"></div>}>
                {recentOrders.length > 0 ? (
                  <RecentOrders orders={recentOrders} />
                ) : (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-80 flex items-center justify-center">
                    <div className="text-gray-400">Загрузка последних заказов...</div>
                  </div>
                )}
              </Suspense>
            </LazyChartWrapper>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}