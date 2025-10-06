'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  EyeIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/products/Toast';
import CustomSelect from '@/components/admin/products/CustomSelect';

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
    imageUrl?: string[]; // JSON array
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
  adminComment?: string;
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

function OrdersPageContent() {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  
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
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [timeFromFilter, setTimeFromFilter] = useState<string>('00:00');
  const [timeToFilter, setTimeToFilter] = useState<string>('23:59');
  
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
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false);
  const [isCancelWarningModalOpen, setIsCancelWarningModalOpen] = useState(false);
  const [isCancelCommentModalOpen, setIsCancelCommentModalOpen] = useState(false);
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
  
  // Состояние для автоматического обновления (всегда включено)
  const [lastOrderUpdateTime, setLastOrderUpdateTime] = useState<Date | null>(null);
  const [isCheckingOrders, setIsCheckingOrders] = useState(false);
  const lastAddNewOrdersTime = useRef<number>(0);
  
  // Отслеживание уже показанных уведомлений для предотвращения дублирования
  const notifiedOrderIds = useRef<Set<string>>(new Set());
  
  
  // Новые состояния для модальных окон
  const [courierComment, setCourierComment] = useState('');
  const [cancelComment, setCancelComment] = useState('');
  const [isCourierEditModalOpen, setIsCourierEditModalOpen] = useState(false);
  const [availableCouriers, setAvailableCouriers] = useState<Array<{id: string, fullname: string, phoneNumber: string}>>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [isAdminCommentEditModalOpen, setIsAdminCommentEditModalOpen] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [isCustomerCommentModalOpen, setIsCustomerCommentModalOpen] = useState(false);
  const [isCancelReasonModalOpen, setIsCancelReasonModalOpen] = useState(false);
  const [isAdminCommentViewModalOpen, setIsAdminCommentViewModalOpen] = useState(false);
  
  // Состояние для раскрытия статистики на мобильных
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  
  // Состояние для мобильных фильтров
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Состояния для инлайнового редактирования дат
  const [isEditingDateFrom, setIsEditingDateFrom] = useState(false);
  const [isEditingDateTo, setIsEditingDateTo] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');

  // Функции для работы с датами

  // Автоматическое форматирование даты при вводе (ДД.ММ.ГГГГ)
  const formatDateInput = (input: string, previousValue: string = '') => {
    // Удаляем все нецифровые символы
    const digits = input.replace(/\D/g, '');
    const previousDigits = previousValue.replace(/\D/g, '');
    
    // Ограничиваем до 8 цифр (ДДММГГГГ)
    const limitedDigits = digits.slice(0, 8);
    
    // Определяем, удаляет ли пользователь символы
    const isDeleting = limitedDigits.length < previousDigits.length;
    
    // Форматируем в зависимости от длины
    if (limitedDigits.length < 2) {
      return limitedDigits;
    } else if (limitedDigits.length === 2) {
      // Ставим точку только если пользователь добавляет символы, а не удаляет
      return isDeleting ? limitedDigits : `${limitedDigits}.`;
    } else if (limitedDigits.length === 3) {
      // После 2 цифр дня и 1 цифры месяца
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length === 4) {
      // Ставим вторую точку только если пользователь добавляет символы
      return isDeleting ? `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}` : `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 4)}.`;
    } else {
      // После 4 цифр (день + месяц) ставим вторую точку и год
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 4)}.${limitedDigits.slice(4)}`;
    }
  };

  // Проверка валидности даты в реальном времени (ДД.ММ.ГГГГ)
  const validateDateInput = (dateString: string) => {
    if (!dateString) return { isValid: true, error: '' };
    
    // Проверяем формат ДД.ММ.ГГГГ
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return { isValid: false, error: 'Неверный формат. Используйте ДД.ММ.ГГГГ' };
    }
    
    // Парсим дату из формата ДД.ММ.ГГГГ
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Проверяем валидность даты
    if (isNaN(date.getTime()) || 
        date.getDate() !== day || 
        date.getMonth() !== month - 1 || 
        date.getFullYear() !== year) {
      return { isValid: false, error: 'Неверная дата' };
    }
    
    // Проверяем, что дата не в будущем (опционально)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      return { isValid: false, error: 'Дата не может быть в будущем' };
    }
    
    return { isValid: true, error: '' };
  };

  // Конвертация из ДД.ММ.ГГГГ в ГГГГ-ММ-ДД для сохранения
  const convertToISOFormat = (dateString: string) => {
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return '';
    const [day, month, year] = dateString.split('.').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Конвертация из ГГГГ-ММ-ДД в ДД.ММ.ГГГГ для отображения
  const convertFromISOFormat = (dateString: string) => {
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
  };

  const handleDateFromEdit = () => {
    setIsEditingDateFrom(true);
    setTempDateFrom(convertFromISOFormat(dateFromFilter));
  };

  const handleDateToEdit = () => {
    setIsEditingDateTo(true);
    setTempDateTo(convertFromISOFormat(dateToFilter));
  };

  // Обработчики для автоматического форматирования и валидации
  const handleDateFromChange = (value: string) => {
    const formatted = formatDateInput(value, tempDateFrom);
    setTempDateFrom(formatted);
    
    // Очищаем фильтр если поле пустое
    if (!formatted || formatted.length === 0) {
      setDateFromFilter('');
      setTimeFromFilter('00:00');
      return;
    }
    
    // Автосохранение при полной и валидной дате
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
    
    // Очищаем фильтр если поле пустое
    if (!formatted || formatted.length === 0) {
      setDateToFilter('');
      setTimeToFilter('23:59');
      return;
    }
    
    // Автосохранение при полной и валидной дате
    const validation = validateDateInput(formatted);
    if (validation.isValid && formatted.length === 10) {
      const isoFormat = convertToISOFormat(formatted);
      setDateToFilter(isoFormat);
      setTimeToFilter('23:59');
      setIsEditingDateTo(false);
    }
  };

  // Обработчики потери фокуса
  const handleDateFromBlur = () => {
    // Очищаем фильтр если поле пустое
    if (!tempDateFrom || tempDateFrom.length === 0) {
      setDateFromFilter('');
      setTimeFromFilter('00:00');
      setTempDateFrom('');
      setIsEditingDateFrom(false);
      return;
    }
    
    const validation = validateDateInput(tempDateFrom);
    if (validation.isValid && tempDateFrom.length === 10) {
      // Сохраняем если дата полная и валидная
      const isoFormat = convertToISOFormat(tempDateFrom);
      setDateFromFilter(isoFormat);
      setTimeFromFilter('00:00');
    } else {
      // Обнуляем если дата неполная или невалидная
      setTempDateFrom('');
    }
    setIsEditingDateFrom(false);
  };

  const handleDateToBlur = () => {
    // Очищаем фильтр если поле пустое
    if (!tempDateTo || tempDateTo.length === 0) {
      setDateToFilter('');
      setTimeToFilter('23:59');
      setTempDateTo('');
      setIsEditingDateTo(false);
      return;
    }
    
    const validation = validateDateInput(tempDateTo);
    if (validation.isValid && tempDateTo.length === 10) {
      // Сохраняем если дата полная и валидная
      const isoFormat = convertToISOFormat(tempDateTo);
      setDateToFilter(isoFormat);
      setTimeToFilter('23:59');
    } else {
      // Обнуляем если дата неполная или невалидная
      setTempDateTo('');
    }
    setIsEditingDateTo(false);
  };

  const cancelDateEdit = () => {
    setIsEditingDateFrom(false);
    setIsEditingDateTo(false);
    setTempDateFrom('');
    setTempDateTo('');
  };



  // Создаем стабильную ссылку на функцию добавления новых заказов
  const addNewOrdersRef = useRef<(() => Promise<void>) | null>(null);
  
  // Инкрементальное обновление заказов (новые + измененные)
  const updateOrdersIncrementally = useCallback(async () => {
    const now = Date.now();
    // Предотвращаем вызовы чаще чем раз в 2 секунды
    if (now - lastAddNewOrdersTime.current < 2000) {
      console.log('updateOrdersIncrementally: Skipping - too soon since last call');
      return;
    }
    lastAddNewOrdersTime.current = now;
    
    // Если активны любые фильтры, поиск или нестандартная сортировка, не выполняем автообновление
    const hasActiveFilters = dateFromFilter || dateToFilter || statusFilter.length > 0 || 
                             debouncedSearchTerm.trim() || sortBy !== 'newest' || sortOrder !== 'desc';
    
    if (hasActiveFilters) {
      console.log('updateOrdersIncrementally: Skipping due to active filters, search or custom sorting');
      return;
    }
    
    console.log('updateOrdersIncrementally: Starting to check for new and updated orders');
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50', // Увеличиваем лимит для проверки изменений в существующих заказах
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
        ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`updateOrdersIncrementally: Fetched ${data.orders.length} orders from API`);
        
        setOrders(prevOrders => {
          const existingOrdersMap = new Map(prevOrders.map(order => [order.id, order]));
          const newOrders: Order[] = [];
          const updatedOrders: Order[] = [];
          
          // Проверяем каждый заказ из API
          data.orders.forEach((apiOrder: Order) => {
            const existingOrder = existingOrdersMap.get(apiOrder.id);
            
            if (!existingOrder) {
              // Это новый заказ
              const orderUpdateTime = new Date(apiOrder.updatedAt);
              const isNew = lastOrderUpdateTime ? orderUpdateTime > lastOrderUpdateTime : true;
              if (isNew) {
                newOrders.push(apiOrder);
                console.log(`New order found: ${apiOrder.id}`);
              }
            } else {
              // Проверяем, изменился ли существующий заказ
              const apiOrderTime = new Date(apiOrder.updatedAt);
              const existingOrderTime = new Date(existingOrder.updatedAt);
              
              if (apiOrderTime > existingOrderTime) {
                updatedOrders.push(apiOrder);
                console.log(`Updated order found: ${apiOrder.id} (${apiOrderTime.toISOString()} > ${existingOrderTime.toISOString()})`);
              }
            }
          });
          
          console.log(`updateOrdersIncrementally: Found ${newOrders.length} new orders and ${updatedOrders.length} updated orders`);
          
          // Показываем уведомления для новых заказов
          newOrders.forEach((order: Order) => {
            if (!notifiedOrderIds.current.has(order.id)) {
              notifiedOrderIds.current.add(order.id);
              showSuccess('Новый заказ', `Поступил заказ #${order.id.slice(-8)} от ${truncateText(order.customerName, 20)}`);
              
              // Очищаем старые уведомления (оставляем только последние 50)
              if (notifiedOrderIds.current.size > 50) {
                const idsArray = Array.from(notifiedOrderIds.current);
                const toRemove = idsArray.slice(0, idsArray.length - 50);
                toRemove.forEach(id => notifiedOrderIds.current.delete(id));
              }
            }
          });
          
          // Показываем уведомления для обновленных заказов (более сдержанно)
          if (updatedOrders.length > 0) {
            console.log(`Обновлено заказов: ${updatedOrders.length}`);
            // Можно добавить уведомление, но не для каждого заказа отдельно
            // showSuccess('Обновления', `Обновлено ${updatedOrders.length} заказов`);
          }
          
          if (newOrders.length === 0 && updatedOrders.length === 0) {
            console.log('updateOrdersIncrementally: No changes found');
            return prevOrders;
          }
          
          // Создаем обновленный список заказов
          const updatedOrdersMap = new Map(updatedOrders.map(order => [order.id, order]));
          
          // Удаляем обновленные заказы из их старых позиций и обновляем данные остальных
          const ordersWithoutUpdated = prevOrders
            .filter(order => !updatedOrdersMap.has(order.id))
            .map(order => order);
          
          // Объединяем все заказы: новые + обновленные + остальные
          const allOrders = [...newOrders, ...updatedOrders, ...ordersWithoutUpdated];
          
          // Сортируем весь список по updated_at (новые сначала)
          const finalOrders = allOrders.sort((a, b) => {
            const dateA = new Date(a.updatedAt);
            const dateB = new Date(b.updatedAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('updateOrdersIncrementally: Reordered orders by updated_at');
          return finalOrders;
        });
        
        // Обновляем время последнего обновления, если есть изменения
        if (data.orders.length > 0) {
          const latestOrder = data.orders[0];
          setLastOrderUpdateTime(new Date(latestOrder.updatedAt));
        }
      }
    } catch (error) {
      console.error('Error updating orders incrementally:', error);
    }
  }, [lastOrderUpdateTime, statusFilter, debouncedSearchTerm, dateFromFilter, dateToFilter, sortBy, sortOrder, showSuccess]);

  // Обновляем ссылку при изменении функции
  addNewOrdersRef.current = updateOrdersIncrementally;

  // Обновление выбранного заказа
  const updateSelectedOrder = useCallback(async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Updated order data:', data); // Для отладки
        setSelectedOrder(data);
      }
    } catch (error) {
      console.error('Error updating selected order:', error);
    }
  }, [selectedOrder]);

  // Загрузка заказов
  const fetchOrders = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setListLoading(true);
      }
      
      // Отладочная информация
      const dateFromString = dateFromFilter ? getDateTimeString(dateFromFilter, timeFromFilter) : null;
      const dateToString = dateToFilter ? getDateTimeString(dateToFilter, timeToFilter) : null;
      
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy === 'newest' ? 'updatedAt' : sortBy,
        sortOrder,
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
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
        
        // Обновляем время последнего обновления заказов
        if (data.orders.length > 0) {
          const latestOrder = data.orders[0];
          setLastOrderUpdateTime(new Date(latestOrder.updatedAt));
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Ошибка загрузки', 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder, statusFilter, debouncedSearchTerm, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, showError]);

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Задержка 500мс

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortBy, sortOrder, statusFilter, debouncedSearchTerm, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, fetchOrders]);

  // Отдельный эффект для обновления списка при изменении поиска
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      fetchOrders(false);
    }
  }, [debouncedSearchTerm, fetchOrders]);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, sortBy, sortOrder]);


  // Автоматическое обновление заказов каждые 5 секунд (новые + измененные)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Предотвращаем одновременные вызовы
      if (isCheckingOrders) return;
      
      // Если активны любые фильтры, поиск или нестандартная сортировка, не выполняем автообновление
      const hasActiveFilters = dateFromFilter || dateToFilter || statusFilter.length > 0 || 
                               debouncedSearchTerm.trim() || sortBy !== 'newest' || sortOrder !== 'desc';
      
      if (hasActiveFilters) {
        console.log('Auto refresh: Skipping due to active filters, search or custom sorting');
        return;
      }
      
      // Проверяем, что нет открытых модальных окон
      const hasOpenModals = isEditModalOpen || isViewModalOpen || isCourierModalOpen || 
                           isCancelWarningModalOpen || isCancelCommentModalOpen || 
                           isCourierEditModalOpen || isAdminCommentEditModalOpen || 
                           isAdminCommentViewModalOpen || isCustomerCommentModalOpen || 
                           isCancelReasonModalOpen;
      
      if (!hasOpenModals) {
        setIsCheckingOrders(true);
        
        try {
          console.log('Auto refresh: Checking for new and updated orders...');
          // Вызываем функцию инкрементального обновления
          // Она проверяет как новые, так и измененные заказы
          if (addNewOrdersRef.current) {
            await addNewOrdersRef.current();
          }
        } finally {
          setIsCheckingOrders(false);
        }
      } else {
        console.log('Auto refresh: Skipping due to open modals');
      }
    }, 5000); // 5 секунд

    return () => clearInterval(interval);
  }, [isEditModalOpen, isViewModalOpen, isCourierModalOpen, 
      isCancelWarningModalOpen, isCancelCommentModalOpen, isCourierEditModalOpen, 
      isAdminCommentEditModalOpen, isAdminCommentViewModalOpen, isCustomerCommentModalOpen, 
      isCancelReasonModalOpen, isCheckingOrders, dateFromFilter, dateToFilter, 
      statusFilter, debouncedSearchTerm, sortBy, sortOrder]);

  // Обработка URL параметров для автоматического открытия заказа
  useEffect(() => {
    const viewOrderId = searchParams.get('view');
    if (viewOrderId && orders.length > 0) {
      const orderToView = orders.find(o => o.id === viewOrderId);
      if (orderToView) {
        openViewModal(orderToView);
        // Очищаем URL параметр после открытия модального окна
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, orders]);

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
        // Закрываем инлайновые редакторы дат при клике вне
        cancelDateEdit();
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
  const openViewModal = async (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
    setIsOrderDetailsLoading(true);
    
    // Обновляем данные заказа при открытии модального окна
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const updatedOrder = await response.json();
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order details:', error);
      // Не показываем ошибку пользователю, так как у нас есть базовые данные
    } finally {
      setIsOrderDetailsLoading(false);
    }
  };


  // Новые обработчики
  const openCourierModal = (order: Order) => {
    setSelectedOrder(order);
    setCourierComment('');
    setIsCourierModalOpen(true);
  };

  const openCancelWarningModal = (order: Order) => {
    setSelectedOrder(order);
    setIsCancelWarningModalOpen(true);
  };

  const openCancelCommentModal = () => {
    setIsCancelWarningModalOpen(false);
    setCancelComment('');
    setIsCancelCommentModalOpen(true);
  };

  // Обработчики для курьеров
  const openCourierEditModal = async (order: Order) => {
    setSelectedOrder(order);
    setSelectedCourierId(order.courierId || '');
    
    // Загружаем список доступных курьеров
    try {
      const response = await fetch('/api/admin/couriers');
      if (response.ok) {
        const couriers = await response.json();
        setAvailableCouriers(couriers);
      }
    } catch (error) {
      console.error('Error fetching couriers:', error);
      showError('Ошибка загрузки', 'Не удалось загрузить список курьеров');
    }
    
    setIsCourierEditModalOpen(true);
  };

  const handleUpdateCourier = async () => {
    if (!selectedOrder) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/courier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courierId: selectedCourierId || null
        })
      });

      if (response.ok) {
        await fetchOrders();
        await updateSelectedOrder();
        closeCourierEditModal();
        showSuccess('Курьер обновлен', 'Курьер заказа успешно изменен');
      } else {
        const error = await response.json();
        showError('Ошибка обновления', error.error || 'Ошибка обновления курьера');
      }
    } catch (error) {
      console.error('Error updating courier:', error);
      showError('Ошибка обновления', 'Ошибка обновления курьера');
    } finally {
      setFormLoading(false);
    }
  };

  // Обработчики для редактирования комментария админа
  const openAdminCommentEditModal = (order: Order) => {
    setSelectedOrder(order);
    setAdminComment(order.adminComment || '');
    setIsAdminCommentEditModalOpen(true);
  };

  const openCustomerCommentModal = () => {
    setIsCustomerCommentModalOpen(true);
  };

  const openCancelReasonModal = () => {
    setIsCancelReasonModalOpen(true);
  };

  const openAdminCommentViewModal = () => {
    setIsAdminCommentViewModalOpen(true);
  };

  const handleUpdateAdminComment = async () => {
    if (!selectedOrder) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/admin-comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminComment: adminComment.trim() || null
        })
      });

      if (response.ok) {
        await fetchOrders();
        await updateSelectedOrder();
        closeAdminCommentEditModal();
        showSuccess('Комментарий обновлен', 'Комментарий админа успешно сохранен');
      } else {
        const error = await response.json();
        showError('Ошибка обновления', error.error || 'Ошибка обновления комментария');
      }
    } catch (error) {
      console.error('Error updating admin comment:', error);
      showError('Ошибка обновления', 'Ошибка обновления комментария');
    } finally {
      setFormLoading(false);
    }
  };



  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setIsCourierModalOpen(false);
    setIsCancelWarningModalOpen(false);
    setIsCancelCommentModalOpen(false);
    setIsOrderDetailsLoading(false);
    setIsCourierEditModalOpen(false);
    setIsAdminCommentEditModalOpen(false);
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
    setCourierComment('');
    setCancelComment('');
    setSelectedCourierId('');
    setAvailableCouriers([]);
    setAdminComment('');
  };

  // Функции для закрытия отдельных модальных окон
  const closeCourierModal = () => {
    setIsCourierModalOpen(false);
    setCourierComment('');
  };

  const closeCancelWarningModal = () => {
    setIsCancelWarningModalOpen(false);
  };

  const closeCancelCommentModal = () => {
    setIsCancelCommentModalOpen(false);
    setCancelComment('');
  };

  const closeCourierEditModal = () => {
    setIsCourierEditModalOpen(false);
    setSelectedCourierId('');
    setAvailableCouriers([]);
  };

  const closeAdminCommentEditModal = () => {
    setIsAdminCommentEditModalOpen(false);
    setAdminComment('');
  };

  const closeCustomerCommentModal = () => {
    setIsCustomerCommentModalOpen(false);
  };

  const closeCancelReasonModal = () => {
    setIsCancelReasonModalOpen(false);
  };

  const closeAdminCommentViewModal = () => {
    setIsAdminCommentViewModalOpen(false);
  };

  // Функция для обрезки текста
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
        await updateSelectedOrder();
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

  // Передача курьерам
  const handleTransferToCourier = async () => {
    if (!selectedOrder) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/transfer-to-courier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminComment: courierComment.trim() || null
        })
      });

      if (response.ok) {
        await fetchOrders();
        await updateSelectedOrder();
        closeCourierModal();
        showSuccess('Заказ передан курьерам', 'Статус заказа изменен на &ldquo;Ожидает курьера&rdquo;');
      } else {
        const error = await response.json();
        showError('Ошибка передачи', error.error || 'Ошибка передачи заказа курьерам');
      }
    } catch (error) {
      console.error('Error transferring to courier:', error);
      showError('Ошибка передачи', 'Ошибка передачи заказа курьерам');
    } finally {
      setFormLoading(false);
    }
  };

  // Отмена заказа
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancelComment: cancelComment.trim()
        })
      });

      if (response.ok) {
        await fetchOrders();
        await updateSelectedOrder();
        closeCancelCommentModal();
        showSuccess('Заказ отменен', 'Статус заказа изменен на &ldquo;Отменен&rdquo;');
      } else {
        const error = await response.json();
        showError('Ошибка отмены', error.error || 'Ошибка отмены заказа');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      showError('Ошибка отмены', 'Ошибка отмены заказа');
    } finally {
      setFormLoading(false);
    }
  };



  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(price) + ' с.';
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

  // Все возможные статусы заказов
  const ALL_STATUSES = ['CREATED', 'COURIER_WAIT', 'COURIER_PICKED', 'ENROUTE', 'DELIVERED', 'CANCELED'];

  // Функции для работы с множественным выбором статусов
  const toggleStatusFilter = (status: string) => {
    if (status === 'all') {
      // Если выбираем "Все статусы", очищаем все остальные
      setStatusFilter([]);
    } else {
      // Если выбираем конкретный статус, убираем "Все статусы" и добавляем/убираем статус
      setStatusFilter(prev => {
        let newStatusFilter;
        
        if (prev.includes(status)) {
          // Убираем статус из списка
          newStatusFilter = prev.filter(s => s !== status);
        } else {
          // Добавляем статус в список
          newStatusFilter = [...prev, status];
        }
        
        // Проверяем, выбраны ли все статусы
        const allStatusesSelected = ALL_STATUSES.every(s => newStatusFilter.includes(s));
        
        // Если выбраны все статусы, очищаем список (активируем "Все статусы")
        if (allStatusesSelected) {
          return [];
        }
        
        return newStatusFilter;
      });
    }
  };


  // Очистка фильтров
  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter([]);
    setDateFromFilter('');
    setDateToFilter('');
    setTimeFromFilter('00:00');
    setTimeToFilter('23:59');
    // Закрываем редакторы дат
    cancelDateEdit();
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

  // Утилита для форматирования даты в локальном времени
  const formatLocalDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Заказы</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Автообновление</span>
                </div>
              </div>
              <p className="text-gray-300">Управление заказами клиентов</p>
            </div>
            
            {/* Статистика */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 sm:gap-4">
              {/* Мобильная версия - компактная с кнопкой раскрытия */}
              <div className="lg:hidden w-full">
                {/* Компактный вид - только общее количество */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-white font-bold text-sm">Всего заказов: {totalItems}</span>
                  </div>
                  <button
                    onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                    className="p-1 rounded-md hover:bg-gray-700/50 transition-colors"
                  >
                    <ChevronDownIcon 
                      className={`h-4 w-4 text-gray-400 transition-transform ${isStatsExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                </div>
                
                {/* Раскрытая статистика в 2 ряда */}
                {isStatsExpanded && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-300">Создан:</span>
                        </div>
                        <span className="text-white font-semibold text-xs">{statistics.CREATED}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <CheckCircleIcon className="h-3 w-3 text-yellow-400" />
                          <span className="text-gray-300">Ожидает курьера:</span>
                        </div>
                        <span className="text-white font-semibold text-xs">{statistics.COURIER_WAIT}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3 text-indigo-400" />
                          <span className="text-gray-300">Курьер принял:</span>
                        </div>
                        <span className="text-white font-semibold text-xs">{statistics.COURIER_PICKED}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <TruckIcon className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-300">В пути:</span>
                        </div>
                        <span className="text-white font-semibold text-xs">{statistics.ENROUTE}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <CheckBadgeIcon className="h-3 w-3 text-green-400" />
                          <span className="text-gray-300">Доставлен:</span>
                        </div>
                        <span className="text-white font-semibold text-xs">{statistics.DELIVERED}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <XMarkIcon className="h-3 w-3 text-red-400" />
                          <span className="text-gray-300">Отменен:</span>
                        </div>
                        <span className="text-white font-semibold text-xs">{statistics.CANCELED}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Десктопная версия - оригинальная */}
              <div className="hidden lg:flex items-center justify-between gap-4 w-full">
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
        </div>


        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 relative overflow-visible">
          <div className="space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-row gap-3">
              {/* Search - Left side */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Поиск по номеру заказа, имени, телефону, адресу..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-12 h-10 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 text-sm sm:text-base"
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

              {/* Right side controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Mobile Filter Toggle Button - Only visible on mobile/tablet */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className="flex items-center justify-center px-3 py-2 h-10 rounded-lg border border-gray-600/50 bg-gray-700/30 text-gray-400 hover:border-gray-500/50 hover:text-gray-300 transition-all duration-200"
                    title="Фильтры и сортировка"
                  >
                    <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Controls Row - Hidden on mobile/tablet */}
            <div className="hidden lg:flex flex-col lg:flex-row gap-4">
              {/* Левая сторона - Фильтры и сортировки */}
              <div className="flex flex-col gap-4 flex-1">
                {/* Sort Controls */}
                <div className="flex items-center space-x-3">
                  <div className="w-64 min-w-0">
                    <CustomSelect
                      value={sortBy}
                      onChange={(value) => setSortBy(value as SortOption)}
                      options={[
                        { value: 'newest', label: 'По дате' },
                        { value: 'totalPrice', label: 'По сумме' },
                        { value: 'itemsCount', label: 'По количеству товаров' }
                      ]}
                      icon={<BarsArrowUpIcon className="h-5 w-5" />}
                      placeholder="Сортировка"
                    />
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleStatusFilter('all')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.length === 0
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Все статусы
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('CREATED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('CREATED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Создан
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('COURIER_WAIT')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('COURIER_WAIT')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Ожидает курьера
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('COURIER_PICKED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('COURIER_PICKED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Курьер принял
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('ENROUTE')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('ENROUTE')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      В пути
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('DELIVERED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('DELIVERED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Доставлен
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('CANCELED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('CANCELED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Отменен
                    </button>
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
                  {(searchTerm || statusFilter.length > 0 || dateFromFilter || dateToFilter) && (
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
                <div className="w-80 relative">
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

                {/* To Date */}
                <div className="w-80 relative">
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

            {/* Mobile Filters - Collapsible */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out ${
              isMobileFiltersOpen ? 'max-h-[800px] opacity-100 overflow-visible pointer-events-auto' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
            }`}>
              <div className="space-y-4 pt-4 border-t border-gray-700/50">
                {/* Mobile Sort Controls */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Сортировка</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <CustomSelect
                        value={sortBy}
                        onChange={(value) => setSortBy(value as SortOption)}
                        options={[
                          { value: 'newest', label: 'По дате' },
                          { value: 'totalPrice', label: 'По сумме' },
                          { value: 'itemsCount', label: 'По количеству товаров' }
                        ]}
                        icon={<BarsArrowUpIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        sortOrder === 'desc'
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                      }`}
                      title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                    >
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-4 w-4" />
                      ) : (
                        <ArrowUpIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Статус</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleStatusFilter('all')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.length === 0
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Все статусы
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('CREATED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('CREATED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Создан
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('COURIER_WAIT')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('COURIER_WAIT')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Ожидает курьера
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('COURIER_PICKED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('COURIER_PICKED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Курьер принял
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('ENROUTE')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('ENROUTE')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      В пути
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('DELIVERED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('DELIVERED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Доставлен
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('CANCELED')}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        statusFilter.includes('CANCELED')
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          : 'bg-gray-600/20 border border-gray-600/30 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      Отменен
                    </button>
                  </div>
                </div>

                {/* Mobile Date Range Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Период</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* От даты */}
                    <div className="relative">
                      {!isEditingDateFrom ? (
                        <div
                          onClick={handleDateFromEdit}
                          className={`flex items-center space-x-2 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 py-2.5 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                            dateFromFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                          }`}
                        >
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-white text-xs font-medium flex-1 text-left truncate">
                            {dateFromFilter ? formatDateTimeForDisplay(dateFromFilter, timeFromFilter) : 'От даты'}
                          </span>
                          <ChevronUpDownIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={tempDateFrom}
                          onChange={(e) => handleDateFromChange(e.target.value)}
                          onBlur={handleDateFromBlur}
                          placeholder="ДД.ММ.ГГГГ"
                          className="w-full px-3 py-2.5 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
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

                    {/* До даты */}
                    <div className="relative">
                      {!isEditingDateTo ? (
                        <div
                          onClick={handleDateToEdit}
                          className={`flex items-center space-x-2 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 py-2.5 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                            dateToFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                          }`}
                        >
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-white text-xs font-medium flex-1 text-left truncate">
                            {dateToFilter ? formatDateTimeForDisplay(dateToFilter, timeToFilter) : 'До даты'}
                          </span>
                          <ChevronUpDownIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={tempDateTo}
                          onChange={(e) => handleDateToChange(e.target.value)}
                          onBlur={handleDateToBlur}
                          placeholder="ДД.ММ.ГГГГ"
                          className="w-full px-3 py-2.5 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
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

                {/* Mobile Quick Date Range Buttons */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Быстрый выбор периода</h3>
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

                {/* Mobile Clear Filters */}
                {(searchTerm || statusFilter.length > 0 || dateFromFilter || dateToFilter) && (
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
                    <span className="truncate">Поиск: &ldquo;{debouncedSearchTerm}&rdquo;</span>
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
                {debouncedSearchTerm || statusFilter.length > 0 || dateFromFilter || dateToFilter ? 'Заказы не найдены' : 'Нет заказов'}
              </h3>
              <p className="text-gray-500">
                {debouncedSearchTerm || statusFilter.length > 0 || dateFromFilter || dateToFilter 
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
                <div key={order.id}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden mb-3">
                    <div 
                      onClick={() => openViewModal(order)}
                      className="border border-gray-700/50 rounded-lg p-3 hover:bg-gray-700/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Order Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center">
                          <StatusIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-white text-sm truncate">
                              Заказ #{order.id.slice(-8)}
                            </h3>
                            <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusInfo.label}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <div className="flex items-center space-x-1">
                              <UserIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate" title={order.customerName}>{truncateText(order.customerName, 20)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <CurrencyDollarIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium text-white">{formatPrice(order.totalPrice)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <ShoppingBagIcon className="h-3 w-3 flex-shrink-0" />
                              <span>{order.itemsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block mb-3">
                    <div 
                      className="flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-700/30 rounded-lg p-4 transition-colors duration-200 border border-gray-700/50"
                      onClick={() => openViewModal(order)}
                    >
                      <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                        {/* Order Icon */}
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                          <StatusIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <h3 className="font-medium text-white text-base truncate">
                              Заказ #{order.id.slice(-8)}
                            </h3>
                            
                            <div className="flex items-center space-x-2">
                              <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <UserIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate" title={order.customerName}>{truncateText(order.customerName, 20)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                              <span>{order.customerPhone}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium text-white">{formatPrice(order.totalPrice)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <ShoppingBagIcon className="h-4 w-4 flex-shrink-0" />
                              <span>{order.itemsCount} товаров</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
                              <span>{formatDate(order.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
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
                  disabled={currentPage === 1 || listLoading}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Первая страница"
                >
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || listLoading}
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
                        disabled={listLoading}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  disabled={currentPage === totalPages || listLoading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Следующая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || listLoading}
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
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[9999]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50 flex-shrink-0">
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

              {/* Content - подстраивается под размер, но с ограничением по высоте */}
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
                <div className="p-5">
                  {/* Индикатор загрузки обновления данных */}
                  {isOrderDetailsLoading && (
                    <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="text-blue-300 text-sm">Обновление данных заказа...</span>
                    </div>
                  )}

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
                            <span className="text-white text-sm" title={selectedOrder.customerName}>{truncateText(selectedOrder.customerName, 25)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Телефон</span>
                            <span className="text-white text-sm">{selectedOrder.customerPhone}</span>
                          </div>
                          {/* Contact type removed - not in schema */}
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Адрес</span>
                            <span className="text-white text-sm" title={selectedOrder.deliveryAddress}>{truncateText(selectedOrder.deliveryAddress, 25)}</span>
                          </div>
                          {selectedOrder.customerComment && (
                            <div className="flex items-start justify-between">
                              <span className="text-gray-400 text-sm">Комментарий</span>
                              <div className="flex items-center space-x-2 max-w-[60%]">
                                <span className="text-white text-sm">
                                  {truncateText(selectedOrder.customerComment, 25)}
                                </span>
                                {selectedOrder.customerComment.length > 25 && (
                                  <button
                                    onClick={() => openCustomerCommentModal()}
                                    className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex-shrink-0 border border-gray-600/30 hover:border-indigo-500/50"
                                    title="Показать полный комментарий"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedOrder.status === 'CANCELED' && selectedOrder.cancelComment && (
                            <div className="flex items-start justify-between">
                              <span className="text-gray-400 text-sm">Причина отмены</span>
                              <div className="flex items-center space-x-2 max-w-[60%]">
                                <span className="text-red-300 text-sm">
                                  {truncateText(selectedOrder.cancelComment)}
                                </span>
                                {selectedOrder.cancelComment.length > 50 && (
                                  <button
                                    onClick={() => openCancelReasonModal()}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 border border-gray-600/30 hover:border-red-500/50"
                                    title="Показать полную причину отмены"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Courier Info - показываем только для определенных статусов */}
                    {(selectedOrder.status === 'COURIER_WAIT' || selectedOrder.status === 'COURIER_PICKED' || selectedOrder.status === 'ENROUTE' || selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELED') && (
                      <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <TruckIcon className="h-5 w-5 text-indigo-400" />
                            <h3 className="font-semibold text-white">Информация о курьере</h3>
                          </div>
                          {/* Кнопка изменения курьера - только для статуса COURIER_PICKED */}
                          {selectedOrder.status === 'COURIER_PICKED' && (
                            <button
                              onClick={() => openCourierEditModal(selectedOrder)}
                              className="px-3 py-1 text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-all duration-200"
                            >
                              Изменить
                            </button>
                          )}
                        </div>
                        <div className="space-y-2.5">
                          {selectedOrder.courier ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Имя</span>
                                <span className="text-white text-sm">{selectedOrder.courier.fullname}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Телефон</span>
                                <span className="text-white text-sm">{selectedOrder.courier.phoneNumber}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <span className="text-gray-500 text-sm">Курьер не назначен</span>
                            </div>
                          )}
                          
                          {/* Комментарий админа */}
                          <div className="flex items-start justify-between">
                            <span className="text-gray-400 text-sm">Комментарий админа</span>
                            <div className="flex items-center space-x-2 max-w-[60%]">
                              <span className="text-white text-sm">
                                {selectedOrder.adminComment ? truncateText(selectedOrder.adminComment) : 'Нет комментария'}
                              </span>
                              {selectedOrder.adminComment && selectedOrder.adminComment.length > 50 && (
                                <button
                                  onClick={() => openAdminCommentViewModal()}
                                  className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex-shrink-0 border border-gray-600/30 hover:border-indigo-500/50"
                                  title="Показать полный комментарий"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              )}
                              {/* Кнопка редактирования - только для статуса COURIER_WAIT */}
                              {selectedOrder.status === 'COURIER_WAIT' && (
                                <button
                                  onClick={() => openAdminCommentEditModal(selectedOrder)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex-shrink-0 border border-gray-600/30 hover:border-indigo-500/50"
                                  title="Редактировать комментарий"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment info removed - not in current schema */}

                    {/* Order Items */}
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <ArchiveBoxIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                        <h3 className="font-semibold text-white text-sm sm:text-base">Товары в заказе</h3>
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {selectedOrder.productsCount} позиций
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? selectedOrder.orderItems.map((item, index) => (
                          <div key={item.id} className={`flex items-center space-x-2 sm:space-x-4 p-2 sm:p-3 bg-gray-700/20 rounded-xl border border-gray-600/20 ${
                            index !== (selectedOrder.orderItems?.length || 0) - 1 ? 'border-b border-gray-700/30' : ''
                          }`}>
                            <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 bg-gray-700/50 rounded-xl overflow-hidden">
                              {item.product?.imageUrl && Array.isArray(item.product.imageUrl) && item.product.imageUrl.length > 0 ? (
                                <Image 
                                  src={item.product.imageUrl[0]} 
                                  alt={item.product?.name || 'Товар'}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBagIcon className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-xs sm:text-sm truncate mb-1">{item.product?.name || 'Товар не найден'}</h4>
                              <div className="flex items-center space-x-2 sm:space-x-3 text-xs mb-1">
                                {item.size && (
                                  <span className="text-gray-400 bg-gray-600/30 px-1.5 sm:px-2 py-0.5 rounded text-xs">
                                    {item.size.name}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="text-gray-400 bg-gray-600/30 px-1.5 sm:px-2 py-0.5 rounded flex items-center space-x-1 text-xs">
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{backgroundColor: item.color.colorCode}}></div>
                                    <span>{item.color.name}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs mb-1">
                                <span className="text-gray-400 bg-gray-600/30 px-1.5 sm:px-2 py-0.5 rounded text-xs">
                                  Продавец: {item.product.seller?.fullname || 'Не указан'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatPrice(item.price)} × {item.amount} = {formatPrice(item.price * item.amount)}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-gray-400">
                            <ShoppingBagIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                            <p>Товары не найдены</p>
                          </div>
                        )}
                        
                        {/* Total */}
                        <div className="border-t border-gray-700/30 pt-2 sm:pt-3 mt-2 sm:mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium text-sm sm:text-base">Итого:</span>
                            <span className="text-white font-bold text-base sm:text-lg">{formatPrice(selectedOrder.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons - перемещены под товары */}
                      <div className="mt-6 pt-4 border-t border-gray-700/30">
                        <div className="flex items-center justify-center space-x-3">
                          {/* Кнопка "Передать курьерам" - только для статуса CREATED */}
                          {selectedOrder.status === 'CREATED' && (
                            <button
                              onClick={() => openCourierModal(selectedOrder)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 font-medium text-sm"
                            >
                              Передать курьерам
                            </button>
                          )}
                          
                          {/* Кнопка "Отменить заказ" - для статусов CREATED и COURIER_WAIT */}
                          {(selectedOrder.status === 'CREATED' || selectedOrder.status === 'COURIER_WAIT') && (
                            <button
                              onClick={() => openCancelWarningModal(selectedOrder)}
                              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 font-medium text-sm"
                            >
                              Отменить заказ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer with status info - теперь только статус и дата */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">
                      Статус: <span className="text-white font-medium">{ORDER_STATUSES[selectedOrder.status as keyof typeof ORDER_STATUSES].label}</span>
                      <span className="text-gray-500 ml-2">({formatDate(selectedOrder.updatedAt)})</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium text-sm"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {isEditModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
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
              <div className="overflow-y-auto max-h-[calc(92vh-180px)] scrollbar-thin">
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
                        <CustomSelect
                          value={editFormData.status}
                          onChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                          options={getAvailableStatuses(selectedOrder.status)}
                          icon={<CheckCircleIcon className="h-5 w-5" />}
                          placeholder="Выберите статус"
                        />
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

        {/* Transfer to Courier Modal */}
        {isCourierModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <TruckIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Передать курьерам</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeCourierModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                    <div className="flex items-center space-x-3">
                      <TruckIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div className="text-sm text-blue-300">
                        Статус заказа будет изменен на &ldquo;Ожидает курьера&rdquo;
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <PencilIcon className="h-4 w-4 text-indigo-400" />
                      <span>Комментарий (необязательно)</span>
                    </label>
                    <textarea
                      value={courierComment}
                      onChange={(e) => setCourierComment(e.target.value.slice(0, 150))}
                      className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Добавьте комментарий для курьеров..."
                      maxLength={150}
                    />
                    <div className="text-xs text-gray-500 text-right">
                      {courierComment.length}/150 символов
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeCourierModal}
                    className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  
                  <button
                    onClick={handleTransferToCourier}
                    disabled={formLoading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-blue-500/25"
                  >
                    {formLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Передача...</span>
                      </div>
                    ) : (
                      'Передать курьерам'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Warning Modal */}
        {isCancelWarningModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Отмена заказа</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeCancelWarningModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <div className="flex items-center space-x-3">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <div className="text-sm text-red-300">
                        <strong>Внимание!</strong> Отмена заказа необратима. После отмены заказ нельзя будет вернуть обратно.
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-300">
                    Вы уверены, что хотите отменить этот заказ? Это действие нельзя будет отменить.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeCancelWarningModal}
                    className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  
                  <button
                    onClick={openCancelCommentModal}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-red-500/25"
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Comment Modal */}
        {isCancelCommentModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <XCircleIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Отменить заказ</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeCancelCommentModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <PencilIcon className="h-4 w-4 text-indigo-400" />
                      <span>Причина отмены</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={cancelComment}
                      onChange={(e) => setCancelComment(e.target.value.slice(0, 150))}
                      className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Укажите причину отмены заказа..."
                      required
                      maxLength={150}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Обязательно укажите причину отмены заказа</span>
                      <span>{cancelComment.length}/150 символов</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeCancelCommentModal}
                    className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  
                  <button
                    onClick={handleCancelOrder}
                    disabled={formLoading || !cancelComment.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-red-500/25"
                  >
                    {formLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Отмена...</span>
                      </div>
                    ) : (
                      'Отменить заказ'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Courier Modal */}
        {isCourierEditModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <TruckIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Изменить курьера</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeCourierEditModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-indigo-400" />
                      <span>Выберите курьера</span>
                    </label>
                    <CustomSelect
                      value={selectedCourierId}
                      onChange={(value) => setSelectedCourierId(value)}
                      options={[
                        { value: '', label: 'Без курьера' },
                        ...availableCouriers.map(courier => ({
                          value: courier.id,
                          label: `${courier.fullname} (${courier.phoneNumber})`
                        }))
                      ]}
                      icon={<UserIcon className="h-4 w-4" />}
                      placeholder="Выберите курьера"
                    />
                  </div>

                  {selectedCourierId && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <div className="flex items-center space-x-3">
                        <TruckIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <div className="text-sm text-blue-300">
                          Курьер будет назначен на этот заказ
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeCourierEditModal}
                    className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  
                  <button
                    onClick={handleUpdateCourier}
                    disabled={formLoading}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-indigo-500/25"
                  >
                    {formLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Сохранение...</span>
                      </div>
                    ) : (
                      'Сохранить'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Admin Comment Modal */}
        {isAdminCommentEditModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <PencilIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Редактировать комментарий</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeAdminCommentEditModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <PencilIcon className="h-4 w-4 text-indigo-400" />
                      <span>Комментарий админа</span>
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                      rows={4}
                      placeholder="Добавьте комментарий для курьеров..."
                    />
                    <div className="text-xs text-gray-500">
                      Комментарий будет виден курьерам при работе с заказом
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeAdminCommentEditModal}
                    className="px-4 py-2 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  
                  <button
                    onClick={handleUpdateAdminComment}
                    disabled={formLoading}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-indigo-500/25"
                  >
                    {formLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Сохранение...</span>
                      </div>
                    ) : (
                      'Сохранить'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Comment Modal */}
        {isCustomerCommentModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Комментарий клиента</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeCustomerCommentModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <UserIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <strong>Клиент:</strong> <span title={selectedOrder.customerName}>{truncateText(selectedOrder.customerName, 25)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <PencilIcon className="h-4 w-4 text-indigo-400" />
                      <span>Комментарий клиента</span>
                    </label>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4">
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedOrder.customerComment ? truncateText(selectedOrder.customerComment, 120) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-end">
                  <button
                    onClick={closeCustomerCommentModal}
                    className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-gray-500/25"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Reason Modal */}
        {isCancelReasonModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <XCircleIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Причина отмены</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeCancelReasonModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-300">
                        <strong>Статус:</strong> Заказ отменен
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                      <span>Причина отмены заказа</span>
                    </label>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4">
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedOrder.cancelComment}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-end">
                  <button
                    onClick={closeCancelReasonModal}
                    className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-gray-500/25"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Comment View Modal */}
        {isAdminCommentViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-[10000]">
            <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <PencilIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Комментарий админа</h2>
                    <p className="text-xs text-gray-400">Заказ #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={closeAdminCommentViewModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="space-y-4">
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <PencilIcon className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-indigo-300">
                        <strong>Статус:</strong> {ORDER_STATUSES[selectedOrder.status as keyof typeof ORDER_STATUSES].label}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <PencilIcon className="h-4 w-4 text-indigo-400" />
                      <span>Комментарий админа</span>
                    </label>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4">
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedOrder.adminComment}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <div className="flex items-center justify-end">
                  <button
                    onClick={closeAdminCommentViewModal}
                    className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-gray-500/25"
                  >
                    Закрыть
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

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}

