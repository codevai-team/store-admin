'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CalendarDaysIcon,
  UserIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TruckIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/useToast';

interface User {
  id: string;
  fullname: string;
  role: string;
}

interface OrderItem {
  id: string;
  amount: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string[];
    seller: User;
  };
}

interface Order {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalPrice: number;
  sellerGroups: Array<{
    seller: User;
    items: OrderItem[];
    total: number;
  }>;
  courier?: User;
  orderItems: OrderItem[];
  // Дополнительные поля для заказов продавца
  sellerItems?: OrderItem[];
  sellerTotal?: number;
  // Дополнительные поля для заказов курьера
  courierTotal?: number;
}

interface Statistics {
  totalOrders: number;
  totalRevenue: number;
  sellerStats: Array<{
    seller: User;
    totalRevenue: number;
    totalOrders: number;
    orders: Array<{
      orderId: string;
      orderDate: string;
      items: OrderItem[];
      total: number;
      status: string;
    }>;
  }>;
  courierStats: Array<{
    courier: User;
    totalOrders: number;
    totalRevenue: number;
    orders: Array<{
      orderId: string;
      orderDate: string;
      total: number;
      status: string;
      items: OrderItem[];
    }>;
  }>;
}

interface SellerDebt {
  sellerId: string;
  sellerName: string;
  totalDebt: number;
  totalRevenue: number;
  adminProfit: number;
  commissionRate: number;
  ordersCount: number;
}

interface SellerDebtsData {
  sellerDebts: SellerDebt[];
  summary: {
    totalDebt: number;
    totalRevenue: number;
    totalAdminProfit: number;
    sellersCount: number;
    ordersCount: number;
  };
}

function StatisticsPageContent() {
  const { showError } = useToast();
  
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerDebts, setSellerDebts] = useState<SellerDebtsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  // Фильтры
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('COURIER');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [timeFromFilter, setTimeFromFilter] = useState<string>('00:00');
  const [timeToFilter, setTimeToFilter] = useState<string>('23:59');
  
  // Состояния для редактирования дат
  const [isEditingDateFrom, setIsEditingDateFrom] = useState(false);
  const [isEditingDateTo, setIsEditingDateTo] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  
  // Списки пользователей
  const [users, setUsers] = useState<User[]>([]);
  
  // Состояния для выпадающих списков
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  // Состояния для модального окна заказа
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const itemsPerPage = 50;

  // Mobile filters state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Состояние для отображения долгов продавцам
  const [showSellerDebts, setShowSellerDebts] = useState(false);

  // Функции для работы с датами (как на странице заказов)
  const formatDateInput = (input: string, previousValue: string = '') => {
    const digits = input.replace(/\D/g, '');
    const previousDigits = previousValue.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 8);
    const isDeleting = limitedDigits.length < previousDigits.length;
    
    if (limitedDigits.length < 2) {
      return limitedDigits;
    } else if (limitedDigits.length === 2) {
      return isDeleting ? limitedDigits : `${limitedDigits}.`;
    } else if (limitedDigits.length < 4) {
      return isDeleting ? limitedDigits : `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length === 4) {
      return isDeleting ? limitedDigits : `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}.`;
    } else {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 4)}.${limitedDigits.slice(4)}`;
    }
  };

  const validateDateInput = (dateString: string) => {
    if (!dateString) return { isValid: true, error: '' };
    
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return { isValid: false, error: 'Неверный формат. Используйте ДД.ММ.ГГГГ' };
    }
    
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime()) || 
        date.getDate() !== day || 
        date.getMonth() !== month - 1 || 
        date.getFullYear() !== year) {
      return { isValid: false, error: 'Неверная дата' };
    }
    
    return { isValid: true, error: '' };
  };

  const convertToISOFormat = (dateString: string) => {
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return '';
    const [day, month, year] = dateString.split('.').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const convertFromISOFormat = (dateString: string) => {
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
  };

  const formatDateTimeForDisplay = (date: string, time: string) => {
    if (!date) return 'Выберите дату';
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    const dateObj = new Date(`${date}T${timeWithSeconds}`);
    
    if (isNaN(dateObj.getTime())) {
      return 'Неверная дата';
    }
    
    return dateObj.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDateTimeString = (date: string, time: string) => {
    if (!date) return '';
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    return `${date}T${timeWithSeconds}`;
  };

  const handleDateFromEdit = () => {
    setIsEditingDateFrom(true);
    setTempDateFrom(convertFromISOFormat(dateFromFilter));
  };

  const handleDateToEdit = () => {
    setIsEditingDateTo(true);
    setTempDateTo(convertFromISOFormat(dateToFilter));
  };

  const handleDateFromChange = (value: string) => {
    const formatted = formatDateInput(value, tempDateFrom);
    setTempDateFrom(formatted);
    
    if (!formatted || formatted.length === 0) {
      setDateFromFilter('');
      setTimeFromFilter('00:00');
      return;
    }
    
    const validation = validateDateInput(formatted);
    if (validation.isValid && formatted.length === 10) {
      const isoFormat = convertToISOFormat(formatted);
      setDateFromFilter(isoFormat);
      setTimeFromFilter('00:00');
      setIsEditingDateFrom(false);
    }
  };

  const handleDateToChange = (value: string) => {
    const formatted = formatDateInput(value, tempDateTo);
    setTempDateTo(formatted);
    
    if (!formatted || formatted.length === 0) {
      setDateToFilter('');
      setTimeToFilter('23:59');
      return;
    }
    
    const validation = validateDateInput(formatted);
    if (validation.isValid && formatted.length === 10) {
      const isoFormat = convertToISOFormat(formatted);
      setDateToFilter(isoFormat);
      setTimeToFilter('23:59');
      setIsEditingDateTo(false);
    }
  };

  const handleDateFromBlur = () => {
    if (!tempDateFrom || tempDateFrom.length === 0) {
      setDateFromFilter('');
      setTimeFromFilter('00:00');
      setTempDateFrom('');
      setIsEditingDateFrom(false);
      return;
    }
    
    const validation = validateDateInput(tempDateFrom);
    if (validation.isValid && tempDateFrom.length === 10) {
      const isoFormat = convertToISOFormat(tempDateFrom);
      setDateFromFilter(isoFormat);
      setTimeFromFilter('00:00');
    } else {
      setTempDateFrom('');
    }
    setIsEditingDateFrom(false);
  };

  const handleDateToBlur = () => {
    if (!tempDateTo || tempDateTo.length === 0) {
      setDateToFilter('');
      setTimeToFilter('23:59');
      setTempDateTo('');
      setIsEditingDateTo(false);
      return;
    }
    
    const validation = validateDateInput(tempDateTo);
    if (validation.isValid && tempDateTo.length === 10) {
      const isoFormat = convertToISOFormat(tempDateTo);
      setDateToFilter(isoFormat);
      setTimeToFilter('23:59');
    } else {
      setTempDateTo('');
    }
    setIsEditingDateTo(false);
  };

  // Утилита для форматирования даты в локальном времени
  const formatLocalDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Функция для быстрого выбора периода
  const setQuickDateRange = (range: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    // Используем локальную дату вместо UTC
    const today = formatLocalDate(now);
    
    switch (range) {
      case 'today':
        setDateFromFilter(today);
        setDateToFilter(today);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
      case 'yesterday':
        const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterday = formatLocalDate(yesterdayDate);
        setDateFromFilter(yesterday);
        setDateToFilter(yesterday);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
      case 'week':
        // Получаем понедельник текущей недели
        const currentDay = now.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Если воскресенье, то -6, иначе 1 - currentDay
        const monday = new Date(now.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
        const mondayStr = formatLocalDate(monday);
        
        // Получаем воскресенье текущей недели
        const sundayOffset = currentDay === 0 ? 0 : 7 - currentDay; // Если воскресенье, то 0, иначе 7 - currentDay
        const sunday = new Date(now.getTime() + sundayOffset * 24 * 60 * 60 * 1000);
        const sundayStr = formatLocalDate(sunday);
        
        setDateFromFilter(mondayStr);
        setDateToFilter(sundayStr);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
      case 'month':
        // Получаем первый день текущего месяца (1-е число)
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        
        // Получаем последний день текущего месяца
        // Используем 0-й день следующего месяца (стандартный способ)
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const lastDay = lastDayOfMonth.getDate();
        const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        setDateFromFilter(firstDayStr);
        setDateToFilter(lastDayStr);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
    }
  };

  // Функция для очистки всех фильтров
  const clearFilters = () => {
    setSelectedUser('');
    setSelectedRole('COURIER'); // По умолчанию показываем курьеров
    setDateFromFilter('');
    setDateToFilter('');
    setTimeFromFilter('00:00');
    setTimeToFilter('23:59');
    setTempDateFrom('');
    setTempDateTo('');
    setIsEditingDateFrom(false);
    setIsEditingDateTo(false);
    setIsRoleDropdownOpen(false);
    setIsUserDropdownOpen(false);
  };

  // Функции для работы с выпадающими списками
  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setSelectedUser('');
    setIsRoleDropdownOpen(false);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setIsUserDropdownOpen(false);
    
    // Если выбран администратор, автоматически устанавливаем роль продавца
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'ADMIN') {
      setSelectedRole('SELLER');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SELLER': return 'Продавец';
      case 'COURIER': return 'Курьер';
      default: return 'Курьер';
    }
  };

  const getUserLabel = (userId: string) => {
    if (!userId) return 'Все сотрудники';
    const user = users.find(u => u.id === userId);
    if (!user) return 'Все сотрудники';
    return `${user.fullname} (${user.role === 'SELLER' || user.role === 'ADMIN' ? 'Продавец' : 'Курьер'})`;
  };

  // Функции для работы с модальным окном заказа
  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setIsOrderModalOpen(false);
  };

  // Фильтрация заказов для выбранного продавца (только доставленные)
  const getSellerOrders = () => {
    if (!selectedUser || !statistics) return [];
    
    const sellerStat = statistics.sellerStats.find(stat => stat.seller.id === selectedUser);
    if (!sellerStat) return [];
    
    return sellerStat.orders
      .filter(orderStat => orderStat.status === 'DELIVERED') // Только доставленные заказы
      .map(orderStat => {
        const order = orders.find(o => o.id === orderStat.orderId);
        if (!order) return null;
        
        // Фильтруем только товары выбранного продавца
        const sellerItems = order.orderItems.filter(item => item.product.seller.id === selectedUser);
        
        return {
          ...order,
          orderItems: sellerItems,
          sellerItems: sellerItems,
          sellerTotal: sellerItems.reduce((sum, item) => sum + (item.price * item.amount), 0)
        };
      }).filter((order): order is NonNullable<typeof order> => order !== null);
  };

  // Фильтрация заказов для выбранного курьера (все доставленные заказы за период)
  const getCourierOrders = () => {
    if (!selectedUser || !statistics) return [];
    
    // Возвращаем все доставленные заказы за выбранный период
    return orders
      .filter(order => order.status === 'DELIVERED') // Только доставленные заказы
      .map(order => ({
        ...order,
        orderItems: order.orderItems,
        courierTotal: order.totalPrice
      }));
  };

  // Пагинация для заказов продавца (теперь данные уже приходят с сервера)
  const getPaginatedSellerOrders = () => {
    return getSellerOrders();
  };

  // Пагинация для заказов курьера (теперь данные уже приходят с сервера)
  const getPaginatedCourierOrders = () => {
    return getCourierOrders();
  };

  // Функция для смены страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrders(page, true);
  };

  // Сброс пагинации при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUser, selectedRole, dateFromFilter, dateToFilter]);

  // Загрузка пользователей
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch {
      // Ошибка при загрузке пользователей
    }
  }, []);

  // Загрузка только заказов (без статистики)
  const fetchOrders = useCallback(async (page: number = 1, isPagination: boolean = false) => {
    try {
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setOrdersLoading(true);
      }
      
      const params = new URLSearchParams();
      if (selectedUser) {
        params.append('userId', selectedUser);
      }
      if (selectedRole) {
        params.append('userRole', selectedRole);
      }
      if (dateFromFilter) {
        const dateFromString = getDateTimeString(dateFromFilter, timeFromFilter);
        params.append('dateFrom', dateFromString);
      }
      if (dateToFilter) {
        const dateToString = getDateTimeString(dateToFilter, timeToFilter);
        params.append('dateTo', dateToString);
      }
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/admin/statistics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        
        // Обновляем информацию о пагинации
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        showError('Ошибка', 'Ошибка при загрузке заказов');
      }
    } catch {
      showError('Ошибка', 'Ошибка при загрузке заказов');
    } finally {
      if (isPagination) {
        setPaginationLoading(false);
      } else {
        setOrdersLoading(false);
      }
    }
  }, [selectedUser, selectedRole, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, showError, itemsPerPage]);

  // Загрузка статистики при первой загрузке и при изменении фильтров
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedUser) {
        params.append('userId', selectedUser);
      }
      if (selectedRole) {
        params.append('userRole', selectedRole);
      }
      if (dateFromFilter) {
        const dateFromString = getDateTimeString(dateFromFilter, timeFromFilter);
        params.append('dateFrom', dateFromString);
      }
      if (dateToFilter) {
        const dateToString = getDateTimeString(dateToFilter, timeToFilter);
        params.append('dateTo', dateToString);
      }
      params.append('page', '1');
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/admin/statistics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
        setOrders(data.orders);
        
        // Обновляем информацию о пагинации
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        showError('Ошибка', 'Ошибка при загрузке статистики');
      }
    } catch {
      showError('Ошибка', 'Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, selectedRole, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, showError, itemsPerPage]);

  // Загрузка долгов продавцам
  const fetchSellerDebts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFromFilter) {
        const dateFromString = getDateTimeString(dateFromFilter, timeFromFilter);
        params.append('dateFrom', dateFromString);
      }
      if (dateToFilter) {
        const dateToString = getDateTimeString(dateToFilter, timeToFilter);
        params.append('dateTo', dateToString);
      }
      // Добавляем фильтр по продавцу, если выбран конкретный продавец
      if (selectedUser && selectedRole === 'SELLER') {
        params.append('sellerId', selectedUser);
      }
      
      const response = await fetch(`/api/admin/seller-debts?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch seller debts');
      }
      
      const data = await response.json();
      setSellerDebts(data);
    } catch (error) {
      console.error('Error fetching seller debts:', error);
      showError('Ошибка', 'Ошибка при загрузке долгов продавцам');
    }
  }, [dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, selectedUser, selectedRole, showError]);

  // Загружаем статистику при первой загрузке и при изменении фильтров
  useEffect(() => {
    fetchStatistics();
    // Загружаем долги только если они должны отображаться
    if (showSellerDebts) {
      fetchSellerDebts();
    }
  }, [fetchStatistics, fetchSellerDebts, selectedUser, selectedRole, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, showSellerDebts]);

  // Загружаем заказы при изменении фильтров
  useEffect(() => {
    if (statistics) { // Только если статистика уже загружена
      fetchOrders();
    }
  }, [selectedUser, selectedRole, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, fetchOrders, statistics]);

  // Загружаем пользователей при монтировании
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Перезагружаем долги при изменении выбранного пользователя, если долги отображаются
  useEffect(() => {
    if (showSellerDebts && selectedRole === 'SELLER') {
      fetchSellerDebts();
    }
  }, [selectedUser, showSellerDebts, selectedRole, fetchSellerDebts]);

  // Auto-close mobile filters when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Закрытие выпадающих списков при клике вне их
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsRoleDropdownOpen(false);
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' с.';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Дата обновления не указана';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      CREATED: 'bg-blue-500/20 text-blue-300',
      COURIER_WAIT: 'bg-yellow-500/20 text-yellow-300',
      COURIER_PICKED: 'bg-orange-500/20 text-orange-300',
      ENROUTE: 'bg-purple-500/20 text-purple-300',
      DELIVERED: 'bg-green-500/20 text-green-300',
      CANCELED: 'bg-red-500/20 text-red-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      CREATED: 'Создан',
      COURIER_WAIT: 'Ожидает курьера',
      COURIER_PICKED: 'Курьер принял',
      ENROUTE: 'В пути',
      DELIVERED: 'Доставлен',
      CANCELED: 'Отменен',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Загрузка статистики...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Статистика</h1>
              <p className="text-gray-300">Анализ продаж и выплат сотрудникам</p>
              
              {/* Мобильные карточки статистики - под текстом */}
              <div className="lg:hidden mt-4">
                {/* Статистика выбранного продавца */}
                {selectedUser && selectedRole === 'SELLER' && statistics && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-3 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-blue-500/20 rounded">
                          <ShoppingBagIcon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-blue-300 text-xs font-medium">Заказы</p>
                          <p className="text-sm font-bold text-white">
                            {statistics.sellerStats.find(stat => stat.seller.id === selectedUser)?.totalOrders || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-green-500/20 rounded">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-green-300 text-xs font-medium">Выручка</p>
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(statistics.sellerStats.find(stat => stat.seller.id === selectedUser)?.totalRevenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Статистика выбранного курьера */}
                {selectedUser && selectedRole === 'COURIER' && statistics && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-3 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-blue-500/20 rounded">
                          <TruckIcon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-blue-300 text-xs font-medium">Заказы</p>
                          <p className="text-sm font-bold text-white">
                            {statistics.courierStats.find(stat => stat.courier.id === selectedUser)?.totalOrders || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-green-500/20 rounded">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-green-300 text-xs font-medium">Выручка</p>
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(statistics.courierStats.find(stat => stat.courier.id === selectedUser)?.totalRevenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Статистика для роли продавца */}
                {!selectedUser && selectedRole === 'SELLER' && statistics && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-3 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-blue-500/20 rounded">
                          <ShoppingBagIcon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-blue-300 text-xs font-medium">Заказы</p>
                          <p className="text-sm font-bold text-white">
                            {statistics.sellerStats.reduce((sum, stat) => sum + stat.totalOrders, 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-green-500/20 rounded">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-green-300 text-xs font-medium">Выручка</p>
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(statistics.sellerStats.reduce((sum, stat) => sum + stat.totalRevenue, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Статистика для роли курьера */}
                {!selectedUser && selectedRole === 'COURIER' && statistics && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-3 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-blue-500/20 rounded">
                          <TruckIcon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-blue-300 text-xs font-medium">Заказы</p>
                          <p className="text-sm font-bold text-white">
                            {statistics.courierStats.reduce((sum, stat) => sum + stat.totalOrders, 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-green-500/20 rounded">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="ml-2">
                          <p className="text-green-300 text-xs font-medium">Выручка</p>
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(statistics.courierStats.reduce((sum, stat) => sum + stat.totalRevenue, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Десктопные карточки статистики - справа */}
            <div className="hidden lg:flex gap-3 mt-4 lg:mt-0">
              {/* Статистика выбранного продавца */}
              {selectedUser && selectedRole === 'SELLER' && statistics && (
                <>
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-2 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <ShoppingBagIcon className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-blue-300 text-xs font-medium">Заказы</p>
                        <p className="text-sm font-bold text-white">
                          {statistics.sellerStats.find(stat => stat.seller.id === selectedUser)?.totalOrders || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-2 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-green-500/20 rounded">
                        <CurrencyDollarIcon className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-green-300 text-xs font-medium">Выручка</p>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(statistics.sellerStats.find(stat => stat.seller.id === selectedUser)?.totalRevenue || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Статистика выбранного курьера */}
              {selectedUser && selectedRole === 'COURIER' && statistics && (
                <>
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-2 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <TruckIcon className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-blue-300 text-xs font-medium">Заказы</p>
                        <p className="text-sm font-bold text-white">
                          {statistics.courierStats.find(stat => stat.courier.id === selectedUser)?.totalOrders || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-2 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-green-500/20 rounded">
                        <CurrencyDollarIcon className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-green-300 text-xs font-medium">Выручка</p>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(statistics.courierStats.find(stat => stat.courier.id === selectedUser)?.totalRevenue || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Статистика для роли продавца */}
              {!selectedUser && selectedRole === 'SELLER' && statistics && (
                <>
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-2 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <ShoppingBagIcon className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-blue-300 text-xs font-medium">Заказы</p>
                        <p className="text-sm font-bold text-white">
                          {statistics.sellerStats.reduce((sum, stat) => sum + stat.totalOrders, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-2 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-green-500/20 rounded">
                        <CurrencyDollarIcon className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-green-300 text-xs font-medium">Выручка</p>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(statistics.sellerStats.reduce((sum, stat) => sum + stat.totalRevenue, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Статистика для роли курьера */}
              {!selectedUser && selectedRole === 'COURIER' && statistics && (
                <>
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-2 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <TruckIcon className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-blue-300 text-xs font-medium">Заказы</p>
                        <p className="text-sm font-bold text-white">
                          {statistics.courierStats.reduce((sum, stat) => sum + stat.totalOrders, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-2 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-1 bg-green-500/20 rounded">
                        <CurrencyDollarIcon className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="ml-1.5">
                        <p className="text-green-300 text-xs font-medium">Выручка</p>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(statistics.courierStats.reduce((sum, stat) => sum + stat.totalRevenue, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Фильтры и период */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6 mb-8 relative z-10">
          <div className="space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2 text-blue-400" />
                Фильтры и период
              </h2>
              
              {/* Right side controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Mobile Filter Toggle Button - Only visible on mobile/tablet */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className="flex items-center justify-center px-3 py-2 h-10 rounded-lg border border-gray-600/50 bg-gray-700/30 text-gray-400 hover:border-gray-500/50 hover:text-gray-300 transition-all duration-200"
                    title="Фильтры и период"
                  >
                    <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                {/* Clear All Filters Button - Desktop */}
                <div className="hidden lg:block">
                  {(selectedUser || (selectedRole && selectedRole !== 'COURIER') || dateFromFilter || dateToFilter) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1 text-xs bg-gray-600/20 border border-gray-600/30 text-gray-300 rounded-full hover:bg-gray-600/30 transition-all duration-200"
                    >
                      Очистить все фильтры
                    </button>
                  )}
                </div>
              </div>
            </div>
          
            {/* Desktop Filters Row - Hidden on mobile/tablet */}
            <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              {/* Левая сторона - Период */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-300">Период</h3>
                  {/* Quick Date Range Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setQuickDateRange('today')}
                      className="px-3 py-1 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full hover:bg-indigo-500/20 transition-all duration-200"
                    >
                      Сегодня
                    </button>
                    <button
                      onClick={() => setQuickDateRange('yesterday')}
                      className="px-3 py-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full hover:bg-blue-500/20 transition-all duration-200"
                    >
                      Вчера
                    </button>
                    <button
                      onClick={() => setQuickDateRange('week')}
                      className="px-3 py-1 text-xs bg-green-500/10 border border-green-500/20 text-green-300 rounded-full hover:bg-green-500/20 transition-all duration-200"
                    >
                      Неделя
                    </button>
                    <button
                      onClick={() => setQuickDateRange('month')}
                      className="px-3 py-1 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/20 transition-all duration-200"
                    >
                      Месяц
                    </button>
                  </div>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* От даты */}
                <div>
                  <div className="relative">
                    {!isEditingDateFrom ? (
                      <button
                        type="button"
                        onClick={handleDateFromEdit}
                        className={`w-full flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                          dateFromFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                        }`}
                      >
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium flex-1 text-left">
                          {dateFromFilter ? formatDateTimeForDisplay(dateFromFilter, timeFromFilter) : 'От даты'}
                        </span>
                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={tempDateFrom}
                        onChange={(e) => handleDateFromChange(e.target.value)}
                        onBlur={handleDateFromBlur}
                        placeholder="ДД.ММ.ГГГГ"
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setTempDateFrom('');
                            setIsEditingDateFrom(false);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* До даты */}
                <div>
                  <div className="relative">
                    {!isEditingDateTo ? (
                      <button
                        type="button"
                        onClick={handleDateToEdit}
                        className={`w-full flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                          dateToFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                        }`}
                      >
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium flex-1 text-left">
                          {dateToFilter ? formatDateTimeForDisplay(dateToFilter, timeToFilter) : 'До даты'}
                        </span>
                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={tempDateTo}
                        onChange={(e) => handleDateToChange(e.target.value)}
                        onBlur={handleDateToBlur}
                        placeholder="ДД.ММ.ГГГГ"
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setTempDateTo('');
                            setIsEditingDateTo(false);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Правая сторона - Фильтры */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">Фильтры</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Роль сотрудника */}
                <div>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoleDropdownOpen(!isRoleDropdownOpen);
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 flex items-center justify-between"
                    >
                      <span>{getRoleLabel(selectedRole)}</span>
                      <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isRoleDropdownOpen && (
                      <div className="absolute z-[9999] w-full bg-gray-800 border border-gray-600/50 rounded-lg shadow-xl max-h-60 overflow-auto scrollbar-thin mt-1">
                        <div className="py-1">
                          <button
                            onClick={() => handleRoleSelect('SELLER')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                              selectedRole === 'SELLER' 
                                ? 'bg-indigo-600/20 text-indigo-300' 
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                            }`}
                          >
                            <span>Продавец</span>
                            {selectedRole === 'SELLER' && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                          </button>
                          <button
                            onClick={() => handleRoleSelect('COURIER')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                              selectedRole === 'COURIER' 
                                ? 'bg-indigo-600/20 text-indigo-300' 
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                            }`}
                          >
                            <span>Курьер</span>
                            {selectedRole === 'COURIER' && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Сотрудник */}
                <div>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(!isUserDropdownOpen);
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 flex items-center justify-between"
                    >
                      <span className="truncate">{getUserLabel(selectedUser)}</span>
                      <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isUserDropdownOpen && (
                      <div className="absolute z-[9999] w-full bg-gray-800 border border-gray-600/50 rounded-lg shadow-xl max-h-60 overflow-auto scrollbar-thin mt-1">
                        <div className="py-1">
                          <button
                            onClick={() => handleUserSelect('')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                              !selectedUser 
                                ? 'bg-indigo-600/20 text-indigo-300' 
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                            }`}
                          >
                            <span>Все сотрудники</span>
                            {!selectedUser && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                          </button>
                          {users
                            .filter(user => {
                              if (!selectedRole) return true; // Показываем всех когда не выбрана роль
                              if (user.role === selectedRole) return true; // Показываем пользователей с выбранной ролью
                              if (selectedRole === 'SELLER' && user.role === 'ADMIN') return true; // Показываем админов как продавцов
                              if (selectedRole === 'COURIER' && user.role === 'ADMIN') return false; // Не показываем админов как курьеров
                              return false;
                            })
                            .map(user => (
                              <button
                                key={user.id}
                                onClick={() => handleUserSelect(user.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                                  selectedUser === user.id 
                                    ? 'bg-indigo-600/20 text-indigo-300' 
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                                }`}
                              >
                                <span className="truncate">
                                  {user.fullname} ({user.role === 'SELLER' || user.role === 'ADMIN' ? 'Продавец' : 'Курьер'})
                                </span>
                                {selectedUser === user.id && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
            {/* Mobile Filters - Collapsible */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-visible relative z-20 ${
              isMobileFiltersOpen ? 'max-h-[800px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
            }`}>
              <div className="space-y-4 pt-4 border-t border-gray-700/50">
                {/* Mobile Period Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Период</h3>
                  
                  {/* Mobile Quick Date Range Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setQuickDateRange('today')}
                      className="px-3 py-1 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full hover:bg-indigo-500/20 transition-all duration-200"
                    >
                      Сегодня
                    </button>
                    <button
                      onClick={() => setQuickDateRange('yesterday')}
                      className="px-3 py-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full hover:bg-blue-500/20 transition-all duration-200"
                    >
                      Вчера
                    </button>
                    <button
                      onClick={() => setQuickDateRange('week')}
                      className="px-3 py-1 text-xs bg-green-500/10 border border-green-500/20 text-green-300 rounded-full hover:bg-green-500/20 transition-all duration-200"
                    >
                      Неделя
                    </button>
                    <button
                      onClick={() => setQuickDateRange('month')}
                      className="px-3 py-1 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/20 transition-all duration-200"
                    >
                      Месяц
                    </button>
                  </div>

                  {/* Mobile Date Inputs */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* От даты */}
                    <div>
                      <div className="relative">
                        {!isEditingDateFrom ? (
                          <button
                            type="button"
                            onClick={handleDateFromEdit}
                            className={`w-full flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                              dateFromFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                            }`}
                          >
                            <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-white text-sm font-medium flex-1 text-left">
                              {dateFromFilter ? formatDateTimeForDisplay(dateFromFilter, timeFromFilter) : 'От даты'}
                            </span>
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={tempDateFrom}
                            onChange={(e) => handleDateFromChange(e.target.value)}
                            onBlur={handleDateFromBlur}
                            placeholder="ДД.ММ.ГГГГ"
                            className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setTempDateFrom('');
                                setIsEditingDateFrom(false);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* До даты */}
                    <div>
                      <div className="relative">
                        {!isEditingDateTo ? (
                          <button
                            type="button"
                            onClick={handleDateToEdit}
                            className={`w-full flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                              dateToFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                            }`}
                          >
                            <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-white text-sm font-medium flex-1 text-left">
                              {dateToFilter ? formatDateTimeForDisplay(dateToFilter, timeToFilter) : 'До даты'}
                            </span>
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={tempDateTo}
                            onChange={(e) => handleDateToChange(e.target.value)}
                            onBlur={handleDateToBlur}
                            placeholder="ДД.ММ.ГГГГ"
                            className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setTempDateTo('');
                                setIsEditingDateTo(false);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Filters Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Фильтры</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Роль сотрудника */}
                    <div>
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRoleDropdownOpen(!isRoleDropdownOpen);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 flex items-center justify-between"
                        >
                          <span>{getRoleLabel(selectedRole)}</span>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isRoleDropdownOpen && (
                          <div className="absolute z-[9999] w-full bg-gray-800 border border-gray-600/50 rounded-lg shadow-xl max-h-60 overflow-auto scrollbar-thin mt-1">
                            <div className="py-1">
                              <button
                                onClick={() => handleRoleSelect('SELLER')}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                                  selectedRole === 'SELLER' 
                                    ? 'bg-indigo-600/20 text-indigo-300' 
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                                }`}
                              >
                                <span>Продавец</span>
                                {selectedRole === 'SELLER' && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                              </button>
                              <button
                                onClick={() => handleRoleSelect('COURIER')}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                                  selectedRole === 'COURIER' 
                                    ? 'bg-indigo-600/20 text-indigo-300' 
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                                }`}
                              >
                                <span>Курьер</span>
                                {selectedRole === 'COURIER' && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Сотрудник */}
                    <div>
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(!isUserDropdownOpen);
                            setIsRoleDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 flex items-center justify-between"
                        >
                          <span className="truncate">{getUserLabel(selectedUser)}</span>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isUserDropdownOpen && (
                          <div className="absolute z-[9999] w-full bg-gray-800 border border-gray-600/50 rounded-lg shadow-xl max-h-60 overflow-auto scrollbar-thin mt-1">
                            <div className="py-1">
                              <button
                                onClick={() => handleUserSelect('')}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                                  !selectedUser 
                                    ? 'bg-indigo-600/20 text-indigo-300' 
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                                }`}
                              >
                                <span>Все сотрудники</span>
                                {!selectedUser && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                              </button>
                              {users
                                .filter(user => {
                                  if (!selectedRole) return true; // Показываем всех когда не выбрана роль
                                  if (user.role === selectedRole) return true; // Показываем пользователей с выбранной ролью
                                  if (selectedRole === 'SELLER' && user.role === 'ADMIN') return true; // Показываем админов как продавцов
                                  if (selectedRole === 'COURIER' && user.role === 'ADMIN') return false; // Не показываем админов как курьеров
                                  return false;
                                })
                                .map(user => (
                                  <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 ${
                                      selectedUser === user.id 
                                        ? 'bg-indigo-600/20 text-indigo-300' 
                                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                                    }`}
                                  >
                                    <span className="truncate">
                                      {user.fullname} ({user.role === 'SELLER' || user.role === 'ADMIN' ? 'Продавец' : 'Курьер'})
                                    </span>
                                    {selectedUser === user.id && <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Clear Filters Button */}
                {(selectedUser || (selectedRole && selectedRole !== 'COURIER') || dateFromFilter || dateToFilter) && (
                  <div className="pt-2">
                    <button
                      onClick={clearFilters}
                      className="w-full px-3 py-2 text-xs bg-gray-600/20 border border-gray-600/30 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-all duration-200"
                    >
                      Очистить все фильтры
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Общая статистика */}
        {statistics && !selectedUser && !selectedRole && selectedRole !== 'COURIER' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-0">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:from-blue-600/30 hover:to-blue-700/30 transition-all duration-300 relative z-0">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ShoppingBagIcon className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-300 text-sm font-medium">Всего заказов</p>
                  <p className="text-2xl font-bold text-white">{statistics.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:from-green-600/30 hover:to-green-700/30 transition-all duration-300 relative z-0">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-green-300 text-sm font-medium">Общая выручка</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(statistics.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:from-purple-600/30 hover:to-purple-700/30 transition-all duration-300 relative z-0">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <ChartBarIcon className="h-8 w-8 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-purple-300 text-sm font-medium">Средний чек</p>
                  <p className="text-2xl font-bold text-white">
                    {statistics.totalOrders > 0 
                      ? formatCurrency(statistics.totalRevenue / statistics.totalOrders)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка для отображения долгов продавцам */}
        {selectedRole === 'SELLER' && !showSellerDebts && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-400" />
                  Долги продавцам
                </h3>
                <p className="text-gray-400 text-sm">Нажмите кнопку, чтобы посмотреть детальную информацию о долгах продавцам</p>
              </div>
              <button
                onClick={() => {
                  setShowSellerDebts(true);
                  fetchSellerDebts();
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <CurrencyDollarIcon className="h-4 w-4" />
                <span>Показать долги</span>
              </button>
            </div>
          </div>
        )}

        {/* Долги продавцам */}
        {sellerDebts && showSellerDebts && selectedRole === 'SELLER' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-400" />
                {selectedUser && selectedRole === 'SELLER' 
                  ? `Долги продавцу: ${users.find(u => u.id === selectedUser)?.fullname || 'Неизвестный'}`
                  : 'Долги продавцам (к выплате)'
                }
              </h3>
              <button
                onClick={() => setShowSellerDebts(false)}
                className="px-3 py-1 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-all duration-200 text-sm"
              >
                Скрыть
              </button>
            </div>
            
            {/* Сводка */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Общая сумма к выплате</p>
                <p className="text-green-400 font-bold text-lg">{formatCurrency(sellerDebts.summary.totalDebt)}</p>
              </div>
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Общая выручка</p>
                <p className="text-blue-400 font-bold text-lg">{formatCurrency(sellerDebts.summary.totalRevenue)}</p>
              </div>
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Прибыль админа</p>
                <p className="text-purple-400 font-bold text-lg">{formatCurrency(sellerDebts.summary.totalAdminProfit)}</p>
              </div>
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Продавцов</p>
                <p className="text-yellow-400 font-bold text-lg">{sellerDebts.summary.sellersCount}</p>
              </div>
            </div>

            {/* Список продавцов */}
            <div className="space-y-3">
              {sellerDebts.sellerDebts.map((debt) => (
                <div key={debt.sellerId}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    <div className="border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/70 transition-all duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-medium text-white text-sm truncate">{debt.sellerName}</h3>
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded inline-block w-fit">
                                  {debt.commissionRate}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">К выплате:</span>
                                <span className="text-green-400 font-bold">{formatCurrency(debt.totalDebt)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Выручка:</span>
                                <span className="text-blue-400 font-medium">{formatCurrency(debt.totalRevenue)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Прибыль админа:</span>
                                <span className="text-purple-400 font-medium">{formatCurrency(debt.adminProfit)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Заказов:</span>
                                <span className="text-yellow-400 font-medium">{debt.ordersCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div className="border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-row items-center gap-3 mb-1">
                              <h3 className="font-medium text-white text-base truncate">{debt.sellerName}</h3>
                              <div className="flex gap-2">
                                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                                  {debt.commissionRate}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0 text-green-400" />
                                <span>К выплате: </span>
                                <span className="text-green-400 font-bold">{formatCurrency(debt.totalDebt)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <ChartBarIcon className="h-4 w-4 flex-shrink-0 text-blue-400" />
                                <span>Выручка: </span>
                                <span className="text-blue-400 font-medium">{formatCurrency(debt.totalRevenue)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0 text-purple-400" />
                                <span>Прибыль админа: </span>
                                <span className="text-purple-400 font-medium">{formatCurrency(debt.adminProfit)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Заказов</div>
                            <div className="text-lg font-bold text-yellow-400">{debt.ordersCount}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Список заказов выбранного продавца или всех продавцов */}
        {selectedRole === 'SELLER' && (selectedUser ? getSellerOrders().length > 0 : orders.length > 0) && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <ShoppingBagIcon className="h-6 w-6 mr-2 text-green-400" />
                {selectedUser ? 'Заказы продавца' : 'Заказы всех продавцов'}
              </h2>
              <div className="text-sm text-gray-400">
                {selectedUser ? (
                  <>Показано {Math.min((currentPage - 1) * itemsPerPage + 1, getSellerOrders().length)}-{Math.min(currentPage * itemsPerPage, getSellerOrders().length)} из {getSellerOrders().length}</>
                ) : (
                  <>Показано {Math.min((currentPage - 1) * itemsPerPage + 1, orders.length)}-{Math.min(currentPage * itemsPerPage, orders.length)} из {orders.length}</>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {(paginationLoading || ordersLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="ml-3 text-gray-400">Загрузка заказов...</span>
                </div>
              ) : (
                (selectedUser ? getPaginatedSellerOrders() : orders).map((order) => (
                <div key={order.id}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    <div 
                      className="border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
                      onClick={() => openOrderModal(order)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingBagIcon className="h-5 w-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-medium text-white text-sm truncate">Заказ #{order.id.slice(-8)}</h3>
                              <div className="flex flex-wrap gap-1">
                                <span className={`text-xs px-2 py-1 rounded inline-block w-fit ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <UserIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{formatDate(order.updatedAt)}</span>
                              </div>
                              {!selectedUser && order.sellerGroups && order.sellerGroups.length > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-green-400">
                                  <UserIcon className="h-3 w-3 flex-shrink-0" />
                                  <span>Продавец: {order.sellerGroups[0].seller.fullname}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-400 font-bold text-sm">{formatCurrency(order.sellerTotal || order.totalPrice || 0)}</p>
                          <p className="text-gray-400 text-xs">{order.sellerItems?.length || order.orderItems?.length || 0} товаров</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div 
                      className="border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
                      onClick={() => openOrderModal(order)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingBagIcon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-row items-center gap-3 mb-1">
                              <h3 className="font-medium text-white text-base truncate">Заказ #{order.id.slice(-8)}</h3>
                              <div className="flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <UserIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{formatDate(order.updatedAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <ShoppingBagIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{order.sellerItems?.length || order.orderItems?.length || 0} товаров</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-400 font-bold text-lg">{formatCurrency(order.sellerTotal || order.totalPrice || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
            
            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-xs sm:text-sm text-gray-400">
                      <span className="sm:hidden">
                        {currentPage}/{totalPages}
                      </span>
                      <span className="hidden sm:inline">
                        Страница {currentPage} из {totalPages}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    {/* First Page - Hide on mobile */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || paginationLoading || ordersLoading}
                      className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Первая страница"
                    >
                      <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || paginationLoading || ordersLoading}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Предыдущая"
                    >
                      <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {/* Mobile: 3 buttons, Desktop: 5 buttons */}
                      <div className="flex sm:hidden items-center space-x-1">
                        {[...Array(Math.min(3, totalPages))].map((_, index) => {
                          let pageNumber;
                          
                          if (totalPages <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 2) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 1) {
                            pageNumber = totalPages - 2 + index;
                          } else {
                            pageNumber = currentPage - 1 + index;
                          }

                          const isActive = pageNumber === currentPage;

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              disabled={paginationLoading || ordersLoading}
                              className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 min-w-[32px] ${
                                isActive
                                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Desktop: 5 buttons */}
                      <div className="hidden sm:flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          let pageNumber;
                          
                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }

                          const isActive = pageNumber === currentPage;

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              disabled={paginationLoading || ordersLoading}
                              className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 min-w-[36px] ${
                                isActive
                                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || paginationLoading || ordersLoading}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Следующая"
                    >
                      <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* Last Page - Hide on mobile */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || paginationLoading || ordersLoading}
                      className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Последняя страница"
                    >
                      <ChevronDoubleRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Список заказов выбранного курьера или всех курьеров */}
        {selectedRole === 'COURIER' && (selectedUser ? getCourierOrders().length > 0 : orders.length > 0) && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <TruckIcon className="h-6 w-6 mr-2 text-blue-400" />
                {selectedUser ? 'Заказы курьера' : 'Заказы всех курьеров'}
              </h2>
              <div className="text-sm text-gray-400">
                {selectedUser ? (
                  <>Показано {Math.min((currentPage - 1) * itemsPerPage + 1, getCourierOrders().length)}-{Math.min(currentPage * itemsPerPage, getCourierOrders().length)} из {getCourierOrders().length}</>
                ) : (
                  <>Показано {Math.min((currentPage - 1) * itemsPerPage + 1, orders.length)}-{Math.min(currentPage * itemsPerPage, orders.length)} из {orders.length}</>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {(paginationLoading || ordersLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="ml-3 text-gray-400">Загрузка заказов...</span>
                </div>
              ) : (
                (selectedUser ? getPaginatedCourierOrders() : orders).map((order) => (
                <div key={order.id}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    <div 
                      className="border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
                      onClick={() => openOrderModal(order)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TruckIcon className="h-5 w-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-medium text-white text-sm truncate">Заказ #{order.id.slice(-8)}</h3>
                              <div className="flex flex-wrap gap-1">
                                <span className={`text-xs px-2 py-1 rounded inline-block w-fit ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <UserIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{formatDate(order.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-blue-400 font-bold text-sm">{formatCurrency(order.totalPrice)}</p>
                          <p className="text-gray-400 text-xs">{order.orderItems?.length || 0} товаров</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div 
                      className="border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
                      onClick={() => openOrderModal(order)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TruckIcon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-row items-center gap-3 mb-1">
                              <h3 className="font-medium text-white text-base truncate">Заказ #{order.id.slice(-8)}</h3>
                              <div className="flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <UserIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{formatDate(order.updatedAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-400">
                                <ShoppingBagIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{order.orderItems?.length || 0} товаров</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-blue-400 font-bold text-lg">{formatCurrency(order.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
            
            {/* Пагинация для курьера */}
            {totalPages > 1 && (
              <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-xs sm:text-sm text-gray-400">
                      <span className="sm:hidden">
                        {currentPage}/{totalPages}
                      </span>
                      <span className="hidden sm:inline">
                        Страница {currentPage} из {totalPages}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    {/* First Page - Hide on mobile */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || paginationLoading || ordersLoading}
                      className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Первая страница"
                    >
                      <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || paginationLoading || ordersLoading}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Предыдущая"
                    >
                      <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {/* Mobile: 3 buttons, Desktop: 5 buttons */}
                      <div className="flex sm:hidden items-center space-x-1">
                        {[...Array(Math.min(3, totalPages))].map((_, index) => {
                          let pageNumber;
                          
                          if (totalPages <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 2) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 1) {
                            pageNumber = totalPages - 2 + index;
                          } else {
                            pageNumber = currentPage - 1 + index;
                          }

                          const isActive = pageNumber === currentPage;

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              disabled={paginationLoading || ordersLoading}
                              className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 min-w-[32px] ${
                                isActive
                                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Desktop: 5 buttons */}
                      <div className="hidden sm:flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          let pageNumber;
                          
                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }

                          const isActive = pageNumber === currentPage;

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              disabled={paginationLoading || ordersLoading}
                              className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 min-w-[36px] ${
                                isActive
                                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || paginationLoading || ordersLoading}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Следующая"
                    >
                      <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* Last Page - Hide on mobile */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || paginationLoading || ordersLoading}
                      className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Последняя страница"
                    >
                      <ChevronDoubleRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Статистика по продавцам */}
        {statistics && statistics.sellerStats.length > 0 && !selectedUser && !selectedRole && selectedRole !== 'COURIER' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <UserIcon className="h-6 w-6 mr-2 text-green-400" />
              Статистика продавцов
            </h2>
            <div className="space-y-4">
              {statistics.sellerStats.map((sellerStat) => (
                <div key={sellerStat.seller.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{sellerStat.seller.fullname}</h3>
                      <p className="text-gray-400 text-sm">Продавец</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">{formatCurrency(sellerStat.totalRevenue)}</p>
                      <p className="text-gray-400 text-sm">{sellerStat.totalOrders} заказов</p>
                    </div>
                  </div>
                  
                  {/* Список заказов продавца */}
                  <div className="space-y-2">
                    {sellerStat.orders.map((order) => (
                      <div key={order.orderId} className="bg-gray-600 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">Заказ #{order.orderId}</p>
                            <p className="text-gray-300 text-sm">{formatDate(order.orderDate)}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">{formatCurrency(order.total)}</p>
                            <p className="text-gray-400 text-sm">{order.items.length} товаров</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статистика по курьерам */}
        {statistics && statistics.courierStats.length > 0 && !selectedUser && !selectedRole && selectedRole !== 'COURIER' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <TruckIcon className="h-6 w-6 mr-2 text-blue-400" />
              Статистика курьеров
            </h2>
            <div className="space-y-4">
              {statistics.courierStats.map((courierStat) => (
                <div key={courierStat.courier.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{courierStat.courier.fullname}</h3>
                      <p className="text-gray-400 text-sm">Курьер</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-lg">{formatCurrency(courierStat.totalRevenue)}</p>
                      <p className="text-gray-400 text-sm">{courierStat.totalOrders} заказов</p>
                    </div>
                  </div>
                  
                  {/* Список заказов курьера */}
                  <div className="space-y-2">
                    {courierStat.orders.map((order) => (
                      <div key={order.orderId} className="bg-gray-600 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">Заказ #{order.orderId}</p>
                            <p className="text-gray-300 text-sm">{formatDate(order.orderDate)}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400 font-bold">{formatCurrency(order.total)}</p>
                            <p className="text-gray-400 text-sm">{order.items.length} товаров</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Список всех заказов */}
        {orders.length > 0 && !selectedUser && !selectedRole && selectedRole !== 'COURIER' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Все заказы</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Заказ #{order.id.slice(-8)}</h3>
                      <p className="text-gray-300">{order.customerName} • {order.customerPhone}</p>
                      <p className="text-gray-400 text-sm">{order.deliveryAddress}</p>
                      <p className="text-gray-400 text-sm">{formatDate(order.createdAt)}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{formatCurrency(order.totalPrice)}</p>
                      <p className="text-gray-400 text-sm">{order.orderItems.length} товаров</p>
                    </div>
                  </div>
                  
                  {/* Группы по продавцам */}
                  {order.sellerGroups.map((group, index) => (
                    <div key={index} className="bg-gray-600 rounded p-3 mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-green-400 font-medium">Продавец: {group.seller.fullname}</p>
                        <p className="text-green-400 font-bold">{formatCurrency(group.total)}</p>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-300">{item.product.name} x{item.amount}</span>
                            <span className="text-gray-300">{formatCurrency(item.price * item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Курьер */}
                  {order.courier && (
                    <div className="bg-gray-600 rounded p-3 mt-2">
                      <div className="flex justify-between items-center">
                        <p className="text-blue-400 font-medium">Курьер: {order.courier.fullname}</p>
                        <p className="text-blue-400 font-bold">{formatCurrency(order.totalPrice)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Нет данных для отображения</h3>
            <p className="text-gray-500">Попробуйте изменить фильтры или период</p>
          </div>
        )}

        {/* Модальное окно с детальной информацией о заказе */}
        {isOrderModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Заказ #{selectedOrder.id.slice(-8)}</h2>
                  <button
                    onClick={closeOrderModal}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Информация о заказе */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Клиент</h3>
                      <p className="text-white">{selectedOrder.customerName}</p>
                      <p className="text-gray-300 text-sm">{selectedOrder.customerPhone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Дата обновления заказа</h3>
                      <p className="text-white">{formatDate(selectedOrder.updatedAt)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Адрес доставки</h3>
                    <p className="text-white">{selectedOrder.deliveryAddress}</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Статус</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Общая сумма</h3>
                      <p className="text-white font-bold text-lg">{formatCurrency(selectedOrder.totalPrice)}</p>
                    </div>
                  </div>

                  {selectedOrder.courier && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Курьер</h3>
                      <p className="text-blue-400 font-medium">{selectedOrder.courier.fullname}</p>
                    </div>
                  )}
                </div>

                {/* Товары - разная информация в зависимости от роли */}
                <div>
                  {selectedRole === 'SELLER' ? (
                    <>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {selectedUser ? 'Товары продавца' : 'Все товары в заказе'}
                      </h3>
                      <div className="space-y-3">
                        {(selectedUser ? selectedOrder.sellerItems : selectedOrder.orderItems)?.map((item: OrderItem) => (
                          <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{item.product.name}</h4>
                                {!selectedUser && (
                                  <p className="text-gray-300 text-sm">Продавец: {item.product.seller.fullname}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-gray-400 text-sm">Количество: {item.amount}</span>
                                  <span className="text-gray-400 text-sm">Цена за единицу: {formatCurrency(item.price)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-green-400 font-bold text-lg">
                                  {formatCurrency(item.price * item.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-white">
                            {selectedUser ? 'Итого по товарам продавца:' : 'Итого по заказу:'}
                          </span>
                          <span className="text-green-400 font-bold text-xl">
                            {formatCurrency(
                              selectedUser 
                                ? (selectedOrder.sellerTotal || 0)
                                : selectedOrder.totalPrice
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-white mb-4">Все товары в заказе</h3>
                      <div className="space-y-3">
                        {selectedOrder.orderItems?.map((item: OrderItem) => (
                          <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{item.product.name}</h4>
                                <p className="text-gray-300 text-sm">Продавец: {item.product.seller.fullname}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-gray-400 text-sm">Количество: {item.amount}</span>
                                  <span className="text-gray-400 text-sm">Цена за единицу: {formatCurrency(item.price)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-blue-400 font-bold text-lg">
                                  {formatCurrency(item.price * item.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-white">Итого по заказу:</span>
                          <span className="text-blue-400 font-bold text-xl">
                            {formatCurrency(selectedOrder.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}

export default function StatisticsPage() {
  return <StatisticsPageContent />;
}
