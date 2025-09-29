'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PencilIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  BarsArrowUpIcon,
  CalendarDaysIcon,
  ArchiveBoxIcon,
  BarsArrowDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  EyeIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/products/Toast';

interface OrderItem {
  id: string;
  amount: number;
  price: number;
  sizeId?: string;
  colorId?: string;
  product: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: any; // JSON array
    price: number;
    category: {
      id: string;
      name: string;
    };
    seller: {
      id: string;
      fullname: string;
    };
  };
  size?: {
    id: string;
    name: string;
  };
  color?: {
    id: string;
    name: string;
    colorCode: string;
  };
}

// Note: Payment model doesn't exist in current schema
// This interface is kept for compatibility but won't be used

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  courierId?: string;
  status: 'CREATED' | 'COURIER_WAIT' | 'COURIER_PICKED' | 'ENROUTE' | 'DELIVERED' | 'CANCELED';
  customerComment?: string;
  cancelComment?: string;
  createdAt: string;
  updatedAt: string;
  courier?: {
    id: string;
    fullname: string;
    phoneNumber: string;
  };
  orderItems: OrderItem[];
  // Calculated fields
  totalPrice: number;
  itemsCount: number;
  productsCount: number;
}

type SortOption = 'newest' | 'totalPrice' | 'itemsCount';
type SortOrder = 'asc' | 'desc';

const ORDER_STATUSES = {
  CREATED: { label: 'Создан', color: 'bg-blue-500/20 text-blue-300', icon: ClockIcon },
  COURIER_WAIT: { label: 'Ожидает курьера', color: 'bg-yellow-500/20 text-yellow-300', icon: ClockIcon },
  COURIER_PICKED: { label: 'Курьер принял', color: 'bg-orange-500/20 text-orange-300', icon: UserIcon },
  ENROUTE: { label: 'В пути', color: 'bg-purple-500/20 text-purple-300', icon: TruckIcon },
  DELIVERED: { label: 'Доставлен', color: 'bg-green-500/20 text-green-300', icon: CheckCircleIcon },
  CANCELED: { label: 'Отменен', color: 'bg-red-500/20 text-red-300', icon: XCircleIcon },
};

// Removed contact types and payment constants as they're not in the current schema

export default function OrdersPage() {
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({
    CREATED: 0,
    COURIER_WAIT: 0,
    COURIER_PICKED: 0,
    ENROUTE: 0,
    DELIVERED: 0,
    CANCELED: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [timeFromFilter, setTimeFromFilter] = useState<string>('00:00');
  const [timeToFilter, setTimeToFilter] = useState<string>('23:59');
  const [showDateTimeFrom, setShowDateTimeFrom] = useState(false);
  const [showDateTimeTo, setShowDateTimeTo] = useState(false);

  // Refs для инпутов даты и времени
  const dateFromInputRef = useRef<HTMLInputElement>(null);
  const timeFromInputRef = useRef<HTMLInputElement>(null);
  const dateToInputRef = useRef<HTMLInputElement>(null);
  const timeToInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 50;
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    courierId: '',
    customerComment: '',
    cancelComment: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка заказов
  const fetchOrders = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setListLoading(true);
      }
      
      // Отладочная информация
      const dateFromString = dateFromFilter ? getDateTimeString(dateFromFilter, timeFromFilter) : null;
      const dateToString = dateToFilter ? getDateTimeString(dateToFilter, timeToFilter) : null;
      
      console.log('Date filters:', {
        dateFromFilter,
        timeFromFilter,
        dateToFilter,
        timeToFilter,
        dateFromString,
        dateToString
      });
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
        ...(dateFromString && { dateFrom: dateFromString }),
        ...(dateToString && { dateTo: dateToString }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
        setStatistics(data.statistics || {
          PENDING: 0,
          CONFIRMED: 0,
          SHIPPED: 0,
          COMPLETED: 0,
          CANCELLED: 0
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Ошибка загрузки', 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Задержка 500мс

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortBy, sortOrder, statusFilter, debouncedSearchTerm, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter]);

  // Отдельный эффект для обновления списка при изменении поиска
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      fetchOrders(false);
    }
  }, [debouncedSearchTerm]);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, sortBy, sortOrder]);

  // Клавиатурные сокращения и обработка кликов вне элементов
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.date-time-dropdown')) {
        setShowDateTimeFrom(false);
        setShowDateTimeTo(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обработчики модальных окон
  const openViewModal = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      courierId: order.courierId || '',
      customerComment: order.customerComment || '',
      cancelComment: order.cancelComment || ''
    });
    setIsEditModalOpen(true);
  };



  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedOrder(null);
    setEditFormData({
      status: '',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      courierId: '',
      customerComment: '',
      cancelComment: ''
    });
  };

  // Обновление заказа
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        await fetchOrders();
        closeModals();
        showSuccess('Заказ обновлен', 'Изменения успешно сохранены');
      } else {
        const error = await response.json();
        showError('Ошибка обновления', error.error || 'Ошибка обновления заказа');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Ошибка обновления', 'Ошибка обновления заказа');
    } finally {
      setFormLoading(false);
    }
  };



  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Очистка фильтров
  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setTimeFromFilter('00:00');
    setTimeToFilter('23:59');
    setShowDateTimeFrom(false);
    setShowDateTimeTo(false);
  };

  // Функции для работы с датами
  const formatDateTimeForDisplay = (date: string, time: string) => {
    if (!date) return 'Выберите дату';
    // Добавляем секунды для корректного парсинга
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    const dateObj = new Date(`${date}T${timeWithSeconds}`);
    
    // Проверяем валидность даты
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
    // Добавляем секунды если их нет
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    return `${date}T${timeWithSeconds}`;
  };

  const setQuickDateRange = (range: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (range) {
      case 'today':
        setDateFromFilter(today);
        setDateToFilter(today);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setDateFromFilter(yesterday);
        setDateToFilter(yesterday);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setDateFromFilter(weekAgo);
        setDateToFilter(today);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        setDateFromFilter(monthAgo);
        setDateToFilter(today);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        break;
    }
  };

  // Проверка возможности редактирования заказа
  const canEditOrder = (order: Order) => {
    // Нельзя редактировать отмененные заказы
    if (order.status === 'CANCELED') {
      return false;
    }
    return true;
  };



  // Получение доступных статусов для изменения
  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: 'CREATED', label: 'Создан' },
      { value: 'COURIER_WAIT', label: 'Ожидает курьера' },
      { value: 'COURIER_PICKED', label: 'Курьер принял' },
      { value: 'ENROUTE', label: 'В пути' },
      { value: 'DELIVERED', label: 'Доставлен' },
      { value: 'CANCELED', label: 'Отменен' }
    ];

    // Для доставленных заказов можно только отменить
    if (currentStatus === 'DELIVERED') {
      return [
        { value: 'DELIVERED', label: 'Доставлен' },
        { value: 'CANCELED', label: 'Отменен' }
      ];
    }

    // Для заказов в пути нельзя вернуть на более ранние статусы (кроме отмены)
    if (currentStatus === 'ENROUTE') {
      return [
        { value: 'ENROUTE', label: 'В пути' },
        { value: 'DELIVERED', label: 'Доставлен' },
        { value: 'CANCELED', label: 'Отменен' }
      ];
    }

    // Для остальных статусов доступны все
    return allStatuses;
  };

  // Проверка возможности редактирования полей
  const canEditField = (order: Order, field: string) => {
    // Для доставленных заказов можно изменить только статус на CANCELED
    if (order.status === 'DELIVERED' && field !== 'status') {
      return false;
    }
    return true;
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Заказы</h1>
              <p className="text-gray-300">Управление заказами клиентов</p>
            </div>
            
            {/* Статистика */}
            <div className="flex items-center justify-between gap-4">
              {/* Компактная статистика по статусам - левая сторона */}
              <div className="grid grid-cols-2 gap-12">
                {/* Первый столбец */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Создан:</span>
                    </div>
                    <span className="text-white font-semibold ml-8">{statistics.CREATED}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-300">Ожидает курьера:</span>
                    </div>
                    <span className="text-white font-semibold ml-8">{statistics.COURIER_WAIT}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-indigo-400" />
                      <span className="text-gray-300">Курьер принял:</span>
                    </div>
                    <span className="text-white font-semibold ml-8">{statistics.COURIER_PICKED}</span>
                  </div>
                </div>
                
                {/* Второй столбец */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300">В пути:</span>
                    </div>
                    <span className="text-white font-semibold mr-8">{statistics.ENROUTE}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckBadgeIcon className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">Доставлен:</span>
                    </div>
                    <span className="text-white font-semibold mr-8">{statistics.DELIVERED}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <XMarkIcon className="h-4 w-4 text-red-400" />
                      <span className="text-gray-300">Отменен:</span>
                    </div>
                    <span className="text-white font-semibold mr-8">{statistics.CANCELED}</span>
                  </div>
                </div>
              </div>
              
              {/* Всего заказов - правая сторона */}
              <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-lg p-4 backdrop-blur-sm flex-shrink-0 w-20 h-20 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                  <div className="text-center">
                    <div className="text-white font-bold text-[18px]">{totalItems}</div>
                    <div className="text-gray-300 text-[12px]">Всего</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
          <div className="space-y-4">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск по номеру заказа, имени, телефону, адресу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 text-sm sm:text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Левая сторона - Фильтры и сортировки */}
              <div className="flex flex-col gap-4 flex-1">
                {/* Sort Controls */}
                <div className="flex items-center space-x-3">
                  <div className="w-64 min-w-0">
                    <div className="flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3">
                      <BarsArrowUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                      >
                        <option value="newest" className="bg-gray-800">По дате</option>
                        <option value="totalPrice" className="bg-gray-800">По сумме</option>
                        <option value="itemsCount" className="bg-gray-800">По количеству товаров</option>
                      </select>
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                      sortOrder === 'desc'
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                    }`}
                    title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                  >
                    {sortOrder === 'desc' ? (
                      <ArrowDownIcon className="h-5 w-5" />
                    ) : (
                      <ArrowUpIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-3">
                  <div className="w-79 min-w-0">
                    <div className="flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3">
                      <CheckCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                      >
                        <option value="all" className="bg-gray-800">Все статусы</option>
                        <option value="CREATED" className="bg-gray-800">Создан</option>
                        <option value="COURIER_WAIT" className="bg-gray-800">Ожидает курьера</option>
                        <option value="COURIER_PICKED" className="bg-gray-800">Курьер принял</option>
                        <option value="ENROUTE" className="bg-gray-800">В пути</option>
                        <option value="DELIVERED" className="bg-gray-800">Доставлен</option>
                        <option value="CANCELED" className="bg-gray-800">Отменен</option>
                      </select>
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая сторона - Даты */}
              <div className="flex flex-col gap-4 items-start justify-end">
                {/* Quick Date Range Buttons */}
                <div className="flex flex-wrap gap-2 items-center justify-between w-full">
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
                  
                  {/* Clear All Filters Button */}
                  {(searchTerm || statusFilter !== 'all' || dateFromFilter || dateToFilter) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1 text-xs bg-gray-600/20 border border-gray-600/30 text-gray-300 rounded-full hover:bg-gray-600/30 transition-all duration-200"
                    >
                      Очистить фильтры
                    </button>
                  )}
                </div>

                {/* Custom Date Range */}
                <div className="flex flex-col sm:flex-row gap-4">
                {/* From Date */}
                <div className="w-80 relative date-time-dropdown">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDateTimeFrom(!showDateTimeFrom);
                    }}
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

                  {/* Dropdown для "От даты" */}
                  {showDateTimeFrom && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 shadow-2xl ring-1 ring-white/5 z-50 date-time-dropdown">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <CalendarDaysIcon className="h-4 w-4 text-indigo-400" />
                          Выберите дату и время
                        </h3>
                        <button
                          onClick={() => setShowDateTimeFrom(false)}
                          className="p-1 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Date and Time Inputs - Parallel */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Дата</label>
                          <div 
                            className="relative cursor-pointer"
                            onClick={() => {
                              if (dateFromInputRef.current) {
                                dateFromInputRef.current.focus();
                                dateFromInputRef.current.showPicker?.();
                              }
                            }}
                          >
                            <input
                              ref={dateFromInputRef}
                              type="date"
                              value={dateFromFilter}
                              onChange={(e) => setDateFromFilter(e.target.value)}
                              className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 cursor-pointer hover:bg-gray-800/80"
                              style={{
                                colorScheme: 'dark'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Время</label>
                          <div 
                            className="relative cursor-pointer"
                            onClick={() => {
                              if (timeFromInputRef.current) {
                                timeFromInputRef.current.focus();
                                timeFromInputRef.current.showPicker?.();
                              }
                            }}
                          >
                            <input
                              ref={timeFromInputRef}
                              type="time"
                              value={timeFromFilter}
                              onChange={(e) => setTimeFromFilter(e.target.value)}
                              className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 cursor-pointer hover:bg-gray-800/80"
                              style={{
                                colorScheme: 'dark'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDateTimeFrom(false)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Применить
                        </button>
                        <button
                          onClick={() => {
                            setDateFromFilter('');
                            setTimeFromFilter('00:00');
                            setShowDateTimeFrom(false);
                          }}
                          className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium rounded-xl transition-all duration-200 border border-red-500/30"
                        >
                          Очистить
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* To Date */}
                <div className="w-80 relative date-time-dropdown">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDateTimeTo(!showDateTimeTo);
                    }}
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

                  {/* Dropdown для "До даты" */}
                  {showDateTimeTo && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 shadow-2xl ring-1 ring-white/5 z-50 date-time-dropdown">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <CalendarDaysIcon className="h-4 w-4 text-indigo-400" />
                          Выберите дату и время
                        </h3>
                        <button
                          onClick={() => setShowDateTimeTo(false)}
                          className="p-1 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Date and Time Inputs - Parallel */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Дата</label>
                          <div 
                            className="relative cursor-pointer"
                            onClick={() => {
                              if (dateToInputRef.current) {
                                dateToInputRef.current.focus();
                                dateToInputRef.current.showPicker?.();
                              }
                            }}
                          >
                            <input
                              ref={dateToInputRef}
                              type="date"
                              value={dateToFilter}
                              onChange={(e) => setDateToFilter(e.target.value)}
                              className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 cursor-pointer hover:bg-gray-800/80"
                              style={{
                                colorScheme: 'dark'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Время</label>
                          <div 
                            className="relative cursor-pointer"
                            onClick={() => {
                              if (timeToInputRef.current) {
                                timeToInputRef.current.focus();
                                timeToInputRef.current.showPicker?.();
                              }
                            }}
                          >
                            <input
                              ref={timeToInputRef}
                              type="time"
                              value={timeToFilter}
                              onChange={(e) => setTimeToFilter(e.target.value)}
                              className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 cursor-pointer hover:bg-gray-800/80"
                              style={{
                                colorScheme: 'dark'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDateTimeTo(false)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Применить
                        </button>
                        <button
                          onClick={() => {
                            setDateToFilter('');
                            setTimeToFilter('23:59');
                            setShowDateTimeTo(false);
                          }}
                          className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium rounded-xl transition-all duration-200 border border-red-500/30"
                        >
                          Очистить
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <ArchiveBoxIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    Показано {Math.min(itemsPerPage, totalItems)} из {totalItems}
                  </span>
                </div>
                
                {debouncedSearchTerm && (
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Поиск: "{debouncedSearchTerm}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : (
            <div className="relative">
              {listLoading ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <ShoppingBagIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {debouncedSearchTerm || statusFilter !== 'all' || dateFromFilter || dateToFilter ? 'Заказы не найдены' : 'Нет заказов'}
              </h3>
              <p className="text-gray-500">
                {debouncedSearchTerm || statusFilter !== 'all' || dateFromFilter || dateToFilter 
                  ? 'Попробуйте изменить критерии поиска' 
                  : 'Заказы будут отображаться здесь'
                }
              </p>
            </div>
          ) : (
            orders.map(order => {
              const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={order.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800/70 transition-all duration-200">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                      {/* Order Icon */}
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <StatusIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <h3 className="font-medium text-white text-sm sm:text-base truncate">
                            Заказ #{order.id.slice(-8)}
                          </h3>
                          
                          <div className="flex items-center space-x-2">
                            <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusInfo.label}</span>
                            </div>
                            
                            {/* Contact type removed - not in schema */}

                            {/* Payment status removed - not in schema */}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-1">
                          <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                            <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{order.customerName}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                            <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{order.customerPhone}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                            <CurrencyDollarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="font-medium text-white">{formatPrice(order.totalPrice)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                            <ShoppingBagIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{order.itemsCount} товаров</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                      <button
                        onClick={() => openViewModal(order)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Просмотреть"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => openEditModal(order)}
                        disabled={!canEditOrder(order)}
                        className={`p-2 rounded-lg transition-colors ${
                          canEditOrder(order)
                            ? 'text-green-400 hover:bg-green-500/20'
                            : 'text-gray-600 cursor-not-allowed'
                        }`}
                        title={canEditOrder(order) ? "Редактировать" : "Нельзя редактировать отмененный заказ"}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-xs sm:text-sm text-gray-400">
                  Страница {currentPage} из {totalPages}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Первая страница"
                >
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Предыдущая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
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
                        onClick={() => setCurrentPage(pageNumber)}
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

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Следующая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Последняя страница"
                >
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-400">
                {totalItems} заказов всего
              </div>
            </div>
          </div>
        )}

        {/* View Order Modal */}
        {isViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <EyeIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Детали заказа</h2>
                    <p className="text-xs text-gray-400">#{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeModals}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(92vh-80px)]">
                <div className="p-5">

                  <div className="space-y-5">
                    {/* Order & Customer Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Order Info Card */}
                      <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <ShoppingBagIcon className="h-5 w-5 text-indigo-400" />
                          <h3 className="font-semibold text-white">Информация о заказе</h3>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Номер заказа</span>
                            <span className="text-white font-mono text-sm">#{selectedOrder.id.slice(-8)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Статус</span>
                            <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-lg ${
                              ORDER_STATUSES[selectedOrder.status as keyof typeof ORDER_STATUSES].color
                            }`}>
                              <span>{ORDER_STATUSES[selectedOrder.status as keyof typeof ORDER_STATUSES].label}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Сумма заказа</span>
                            <span className="text-white font-semibold">{formatPrice(selectedOrder.totalPrice)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Дата создания</span>
                            <span className="text-white text-sm">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Товаров</span>
                            <span className="text-white text-sm">{selectedOrder.itemsCount} шт ({selectedOrder.productsCount} позиций)</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info Card */}
                      <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <UserIcon className="h-5 w-5 text-indigo-400" />
                          <h3 className="font-semibold text-white">Информация о клиенте</h3>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Имя</span>
                            <span className="text-white text-sm">{selectedOrder.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Телефон</span>
                            <span className="text-white text-sm">{selectedOrder.customerPhone}</span>
                          </div>
                          {/* Contact type removed - not in schema */}
                          <div className="flex flex-col space-y-1">
                            <span className="text-gray-400 text-sm">Адрес</span>
                            <span className="text-white text-sm leading-relaxed">{selectedOrder.deliveryAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment info removed - not in current schema */}

                    {/* Order Items */}
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <ArchiveBoxIcon className="h-5 w-5 text-indigo-400" />
                        <h3 className="font-semibold text-white">Товары в заказе</h3>
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                          {selectedOrder.productsCount} позиций
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedOrder.orderItems.map((item, index) => (
                          <div key={item.id} className={`flex items-center space-x-4 p-3 bg-gray-700/20 rounded-xl border border-gray-600/20 ${
                            index !== selectedOrder.orderItems.length - 1 ? 'border-b border-gray-700/30' : ''
                          }`}>
                            <div className="flex-shrink-0 w-14 h-14 bg-gray-700/50 rounded-xl overflow-hidden">
                              {item.product.imageUrl && Array.isArray(item.product.imageUrl) && item.product.imageUrl.length > 0 ? (
                                <img 
                                  src={item.product.imageUrl[0]} 
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBagIcon className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm truncate">{item.product.name}</h4>
                              <p className="text-xs text-gray-400 mb-1">{item.product.category.name}</p>
                              <div className="flex items-center space-x-3 text-xs">
                                {item.size && (
                                  <span className="text-gray-400 bg-gray-600/30 px-2 py-0.5 rounded">
                                    {item.size.name}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="text-gray-400 bg-gray-600/30 px-2 py-0.5 rounded flex items-center space-x-1">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color.colorCode}}></div>
                                    <span>{item.color.name}</span>
                                  </span>
                                )}
                                <span className="text-gray-400 bg-gray-600/30 px-2 py-0.5 rounded">
                                  Продавец: {item.product.seller.fullname}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                              <div className="text-white font-medium text-sm">
                                {formatPrice(item.price)} × {item.amount}
                              </div>
                              <div className="text-xs text-gray-400">
                                = {formatPrice(item.price * item.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="border-t border-gray-700/30 pt-3 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">Итого:</span>
                            <span className="text-white font-bold text-lg">{formatPrice(selectedOrder.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {isEditModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <PencilIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Редактировать заказ</h2>
                    <p className="text-xs text-gray-400">#{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeModals}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(92vh-180px)]">
                <div className="p-5 space-y-4">

                  {/* Предупреждения */}
                  {(selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELED') && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-300">
                          {selectedOrder.status === 'DELIVERED' && "Доставленный заказ можно только отменить"}
                          {selectedOrder.status === 'CANCELED' && "Отмененный заказ нельзя редактировать"}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status !== 'CANCELED' && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <div className="flex items-center space-x-3">
                        <ShoppingBagIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <div className="text-sm text-blue-300">
                          При отмене заказа товары автоматически вернутся на склад
                        </div>
                      </div>
                    </div>
                  )}

                  <form id="order-edit-form" onSubmit={handleUpdateOrder} className="space-y-5">
                    {/* Статус и способ связи */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-indigo-400" />
                          <span>Статус заказа</span>
                        </label>
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                          required
                        >
                          {getAvailableStatuses(selectedOrder.status).map(status => (
                            <option key={status.value} value={status.value} className="bg-gray-800">
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Contact type field removed - not in schema */}
                    </div>

                    {/* Данные клиента */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                          <UserIcon className="h-4 w-4 text-indigo-400" />
                          <span>Имя клиента</span>
                        </label>
                        <input
                          type="text"
                          value={editFormData.customerName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          disabled={!canEditField(selectedOrder, 'customerName')}
                          className={`w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 ${
                            !canEditField(selectedOrder, 'customerName') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4 text-indigo-400" />
                          <span>Телефон клиента</span>
                        </label>
                        <input
                          type="tel"
                          value={editFormData.customerPhone}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          disabled={!canEditField(selectedOrder, 'customerPhone')}
                          className={`w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 ${
                            !canEditField(selectedOrder, 'customerPhone') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Адрес клиента */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4 text-indigo-400" />
                        <span>Адрес клиента</span>
                      </label>
                      <textarea
                        value={editFormData.deliveryAddress}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        disabled={!canEditField(selectedOrder, 'deliveryAddress')}
                        className={`w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none ${
                          !canEditField(selectedOrder, 'deliveryAddress') ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        rows={3}
                        required
                      />
                    </div>

                    {/* Payment status field removed - not in schema */}

                    {/* Комментарий */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                        <PencilIcon className="h-4 w-4 text-indigo-400" />
                        <span>Комментарий к изменению</span>
                        <span className="text-xs text-gray-500">(необязательно)</span>
                      </label>
                      <textarea
                        value={editFormData.customerComment}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, customerComment: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                        rows={2}
                        placeholder="Укажите причину изменения..."
                      />
                    </div>

                  </form>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2.5 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  
                  <button
                    type="submit"
                    form="order-edit-form"
                    disabled={formLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-indigo-500/25"
                  >
                    {formLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Сохранение...</span>
                      </div>
                    ) : (
                      'Сохранить изменения'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </AdminLayout>
  );
}
