import { useState, useEffect, useCallback } from 'react';
import { formatBishkekDate, createBishkekDateTime } from '@/lib/timezone';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
  type: 'preset' | 'custom';
}

interface DashboardOverview {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  netRevenue: number;
  totalCategories: number;
  activeProducts: number;
  totalCouriers: number;
  totalSellers: number;
}

interface ChartData {
  monthlyRevenue: Array<{ month: string; revenue: number; canceledRevenue: number; orders: number }>;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
  categories: Array<{ name: string; products: number; orders: number; revenue: number }>;
  orderStatus: Array<{ status: string; count: number; revenue: number }>;
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  userStats: Array<{ role: string; count: number; active: number }>;
  courierPerformance: Array<{ name: string; delivered: number; revenue: number }>;
  productInsights: {
    totalColors: number;
    totalSizes: number;
    averagePrice: number;
    deliveryCancelRate: {
      delivered: number;
      canceled: number;
    };
    topSellingColors: Array<{ color: string; count: number }>;
    topSellingSizes: Array<{ size: string; count: number }>;
  };
  recentActivity: Array<{ type: string; message: string; time: string; createdAt: string }>;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  itemsCount: number;
  courierName?: string | null;
}

// Удален неиспользуемый интерфейс DashboardData

export function useDashboardData(selectedRange: DateRange) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState({
    overview: true,
    charts: false,
    recentOrders: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [, setChartsRequested] = useState(false);
  const [, setRecentOrdersRequested] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, overview: true }));
      
      const startDateStr = formatBishkekDate(selectedRange.startDate);
      const endDateStr = formatBishkekDate(selectedRange.endDate);
      const dateFromString = createBishkekDateTime(startDateStr, '00:00');
      const dateToString = createBishkekDateTime(endDateStr, '23:59');
      
      const params = new URLSearchParams({
        dateFrom: dateFromString,
        dateTo: dateToString,
        section: 'overview'
      });
      
      const response = await fetch(`/api/admin/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch overview data');
      }
      
      const data = await response.json();
      setOverview(data.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Overview fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  }, [selectedRange]);

  const fetchChartsData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, charts: true }));
      
      const startDateStr = formatBishkekDate(selectedRange.startDate);
      const endDateStr = formatBishkekDate(selectedRange.endDate);
      const dateFromString = createBishkekDateTime(startDateStr, '00:00');
      const dateToString = createBishkekDateTime(endDateStr, '23:59');
      
      const params = new URLSearchParams({
        dateFrom: dateFromString,
        dateTo: dateToString,
        section: 'charts'
      });
      
      const response = await fetch(`/api/admin/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch charts data');
      }
      
      const data = await response.json();
      setCharts(data.charts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Charts fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, charts: false }));
    }
  }, [selectedRange]);

  const fetchRecentOrdersData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, recentOrders: true }));
      
      const startDateStr = formatBishkekDate(selectedRange.startDate);
      const endDateStr = formatBishkekDate(selectedRange.endDate);
      const dateFromString = createBishkekDateTime(startDateStr, '00:00');
      const dateToString = createBishkekDateTime(endDateStr, '23:59');
      
      const params = new URLSearchParams({
        dateFrom: dateFromString,
        dateTo: dateToString,
        section: 'recentOrders'
      });
      
      const response = await fetch(`/api/admin/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent orders data');
      }
      
      const data = await response.json();
      setRecentOrders(data.recentOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Recent orders fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, recentOrders: false }));
    }
  }, [selectedRange]);

  // Загружаем overview данные сразу (они быстрые и важные)
  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Сбрасываем данные при изменении диапазона дат
  useEffect(() => {
    setCharts(null);
    setRecentOrders([]);
    setChartsRequested(false);
    setRecentOrdersRequested(false);
    // Также сбрасываем состояние загрузки
    setLoading(prev => ({ 
      ...prev, 
      charts: false, 
      recentOrders: false 
    }));
  }, [selectedRange]);

  // Функции для ленивой загрузки других секций
  const loadCharts = useCallback(() => {
    // Упрощенная логика: если данных нет и не идет загрузка, загружаем
    if (!charts && !loading.charts) {
      setChartsRequested(true);
      fetchChartsData();
    }
  }, [charts, loading.charts, fetchChartsData]);

  const loadRecentOrders = useCallback(() => {
    // Упрощенная логика: если данных нет и не идет загрузка, загружаем
    if (recentOrders.length === 0 && !loading.recentOrders) {
      setRecentOrdersRequested(true);
      fetchRecentOrdersData();
    }
  }, [recentOrders.length, loading.recentOrders, fetchRecentOrdersData]);

  return {
    overview,
    charts,
    recentOrders,
    loading,
    error,
    loadCharts,
    loadRecentOrders,
    refetch: {
      overview: fetchOverviewData,
      charts: fetchChartsData,
      recentOrders: fetchRecentOrdersData,
    }
  };
}
