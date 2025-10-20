'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  XMarkIcon,
  BarsArrowUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  TruckIcon,
  ShoppingBagIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import CustomSelect from '@/components/admin/products/CustomSelect';

interface User {
  id: string;
  fullname: string;
  phoneNumber: string;
  role: 'SELLER' | 'COURIER';
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: string;
  _count: {
    products: number;
    deliveredOrders: number;
  };
  commissions?: {
    rate: number;
  }[];
}

interface UserFormData {
  fullname: string;
  phoneNumber: string;
  role: 'SELLER' | 'COURIER';
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  password: string;
  commissionRate?: number;
}

type SortOption = 'fullname' | 'role' | 'createdAt' | 'productsCount' | 'deliveredOrdersCount';
type SortOrder = 'asc' | 'desc';


function StaffPageContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 50;
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Mobile filters state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    fullname: '',
    phoneNumber: '',
    role: 'SELLER',
    password: '',
    commissionRate: 0
  });
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка пользователей
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      if (roleFilter) {
        params.set('role', roleFilter);
      }
      
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, sortBy, sortOrder, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-close mobile filters when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Block body scroll when modal is open
  useEffect(() => {
    const isModalOpen = isCreateModalOpen || isEditModalOpen || isDeleteModalOpen || isViewModalOpen;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCreateModalOpen, isEditModalOpen, isDeleteModalOpen, isViewModalOpen]);

  // Обработка URL параметров для автоматического открытия сотрудника
  useEffect(() => {
    const viewUserId = searchParams.get('view');
    if (viewUserId && users.length > 0) {
      const userToView = users.find(u => u.id === viewUserId);
      if (userToView) {
        openViewModal(userToView);
        // Очищаем URL параметр после открытия модального окна
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, users]);

  // Получение доступных опций сортировки в зависимости от фильтра
  const getSortOptions = useCallback(() => {
    const baseOptions = [
      { value: 'fullname', label: 'По имени' },
      { value: 'role', label: 'По роли' },
      { value: 'createdAt', label: 'По дате' }
    ];

    if (roleFilter === 'SELLER') {
      return [...baseOptions, { value: 'productsCount', label: 'По товарам' }];
    } else if (roleFilter === 'COURIER') {
      return [...baseOptions, { value: 'deliveredOrdersCount', label: 'По заказам' }];
    }

    return baseOptions;
  }, [roleFilter]);

  // Сброс сортировки на базовую при изменении фильтра роли
  useEffect(() => {
    const availableOptions = getSortOptions();
    const currentSortExists = availableOptions.some(option => option.value === sortBy);
    
    if (!currentSortExists) {
      setSortBy('createdAt');
    }
  }, [getSortOptions, sortBy]);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, sortBy, sortOrder]);

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm);
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Пагинация
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Обработчики модальных окон
  const openCreateModal = () => {
    setFormData({ fullname: '', phoneNumber: '', role: 'SELLER', password: '', commissionRate: 0 });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullname: user.fullname,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      password: '',
      commissionRate: user.commissions && user.commissions.length > 0 ? user.commissions[0].rate : 0
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (user: User) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
    setEditingUser(null);
    setDeletingUser(null);
    setViewingUser(null);
    setFormData({ fullname: '', phoneNumber: '', role: 'SELLER', password: '', commissionRate: 0 });
  };

  // Создание пользователя
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullname.trim() || !formData.phoneNumber.trim() || !formData.password.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setIsCreateModalOpen(false);
        setFormData({ fullname: '', phoneNumber: '', role: 'SELLER', password: '', commissionRate: 0 });
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка создания сотрудника');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Ошибка создания сотрудника');
    } finally {
      setFormLoading(false);
    }
  };

  // Обновление пользователя
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formData.fullname.trim() || !formData.phoneNumber.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setIsEditModalOpen(false);
        setEditingUser(null);
        setFormData({ fullname: '', phoneNumber: '', role: 'SELLER', password: '', commissionRate: 0 });
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка обновления сотрудника');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Ошибка обновления сотрудника');
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление пользователя
  const handleDelete = async () => {
    if (!deletingUser) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка удаления сотрудника');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка удаления сотрудника');
    } finally {
      setFormLoading(false);
    }
  };

  // Функции форматирования
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'SELLER':
        return 'Продавец';
      case 'COURIER':
        return 'Курьер';
      default:
        return role;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активный';
      case 'INACTIVE':
        return 'Неактивный';
      case 'DELETED':
        return 'Удален';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-300 bg-green-700/30 border-green-600/50';
      case 'INACTIVE':
        return 'text-yellow-300 bg-yellow-700/30 border-yellow-600/50';
      case 'DELETED':
        return 'text-red-300 bg-red-700/30 border-red-600/50';
      default:
        return 'text-gray-300 bg-gray-700/30 border-gray-600/50';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SELLER':
        return <ShoppingBagIcon className="h-5 w-5 text-green-400" />;
      case 'COURIER':
        return <TruckIcon className="h-5 w-5 text-blue-400" />;
      default:
        return <UsersIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Рендер карточки пользователя
  const renderUserCard = (user: User) => {
    return (
      <div key={user.id}>
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div 
            className="border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => openViewModal(user)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getRoleIcon(user.role)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-white text-sm truncate">{user.fullname}</h3>
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-xs px-2 py-1 rounded inline-block w-fit ${
                        user.role === 'SELLER' 
                          ? 'text-green-300 bg-green-700/30' 
                          : 'text-blue-300 bg-blue-700/30'
                      }`}>
                        {formatRole(user.role)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded inline-block w-fit border ${getStatusColor(user.status)}`}>
                        {formatStatus(user.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <PhoneIcon className="h-3 w-3 flex-shrink-0" />
                      <span>{user.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      {user.role === 'SELLER' ? (
                        <>
                          <CubeIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{user._count.products} товаров</span>
                        </>
                      ) : (
                        <>
                          <TruckIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{user._count.deliveredOrders} заказов</span>
                        </>
                      )}
                    </div>
                    {user.role === 'SELLER' && user.commissions && user.commissions.length > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-orange-400">
                        <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                        <span>{user.commissions[0].rate}% комиссия</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {user.status !== 'DELETED' ? (
                  <>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="p-2 text-gray-500 cursor-not-allowed" title="Удаленные сотрудники нельзя редактировать">
                      <PencilIcon className="h-4 w-4" />
                    </div>
                    <div className="p-2 text-gray-500 cursor-not-allowed" title="Удаленные сотрудники нельзя удалить повторно">
                      <TrashIcon className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div 
            className="border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => openViewModal(user)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getRoleIcon(user.role)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center gap-3 mb-1">
                    <h3 className="font-medium text-white text-base truncate">{user.fullname}</h3>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'SELLER' 
                          ? 'text-green-300 bg-green-700/30' 
                          : 'text-blue-300 bg-blue-700/30'
                      }`}>
                        {formatRole(user.role)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(user.status)}`}>
                        {formatStatus(user.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{user.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      {user.role === 'SELLER' ? (
                        <>
                          <CubeIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{user._count.products} товаров</span>
                        </>
                      ) : (
                        <>
                          <TruckIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{user._count.deliveredOrders} заказов</span>
                        </>
                      )}
                    </div>
                    {user.role === 'SELLER' && user.commissions && user.commissions.length > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-orange-400">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                        <span>{user.commissions[0].rate}% комиссия</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {user.status !== 'DELETED' ? (
                  <>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="p-2 text-gray-500 cursor-not-allowed" title="Удаленные сотрудники нельзя редактировать">
                      <PencilIcon className="h-4 w-4" />
                    </div>
                    <div className="p-2 text-gray-500 cursor-not-allowed" title="Удаленные сотрудники нельзя удалить повторно">
                      <TrashIcon className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Сотрудники</h1>
              <p className="text-gray-300">Управление продавцами и курьерами</p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 relative overflow-visible z-10">
          <div className="space-y-4">
            {/* Search and Sort Row */}
            <div className="flex flex-row gap-3">
              {/* Search - Left side */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Поиск сотрудников..."
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

                {/* Desktop Sort Controls - Hidden on mobile/tablet */}
                <div className="hidden lg:flex items-center space-x-2">
                  <div className="min-w-[200px]">
                    <CustomSelect
                      value={sortBy}
                      onChange={(value) => setSortBy(value as SortOption)}
                      options={getSortOptions()}
                      icon={<BarsArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                      className="text-sm"
                    />
                  </div>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`flex items-center justify-center px-3 py-2 h-10 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                      sortOrder === 'desc'
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                    }`}
                    title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                  >
                    {sortOrder === 'desc' ? (
                      <ArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Filters Row - Hidden on mobile/tablet */}
            <div className="hidden lg:flex flex-col lg:flex-row gap-3">
              {/* Role Filter */}
              <div className="min-w-[200px]">
                <CustomSelect
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value)}
                  options={[
                    { value: '', label: 'Все роли' },
                    { value: 'SELLER', label: 'Продавцы' },
                    { value: 'COURIER', label: 'Курьеры' }
                  ]}
                  icon={<FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="min-w-[200px]">
                <CustomSelect
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={[
                    { value: '', label: 'Активные' },
                    { value: 'INACTIVE', label: 'Неактивные' },
                    { value: 'DELETED', label: 'Удаленные' },
                    { value: 'ALL', label: 'Все статусы' }
                  ]}
                  icon={<div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Mobile Filters - Collapsible */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-visible relative z-20 ${
              isMobileFiltersOpen ? 'max-h-[400px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
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
                        options={getSortOptions()}
                        icon={<BarsArrowUpIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`flex items-center justify-center px-3 py-2 h-10 rounded-lg border transition-all duration-200 flex-shrink-0 ${
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

                {/* Mobile Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Фильтры</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Role Filter */}
                    <CustomSelect
                      value={roleFilter}
                      onChange={(value) => setRoleFilter(value)}
                      options={[
                        { value: '', label: 'Все роли' },
                        { value: 'SELLER', label: 'Продавцы' },
                        { value: 'COURIER', label: 'Курьеры' }
                      ]}
                      icon={<FunnelIcon className="h-4 w-4" />}
                      className="text-sm"
                    />
                    
                    {/* Status Filter */}
                    <CustomSelect
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value)}
                      options={[
                        { value: '', label: 'Активные' },
                        { value: 'INACTIVE', label: 'Неактивные' },
                        { value: 'DELETED', label: 'Удаленные' },
                        { value: 'ALL', label: 'Все статусы' }
                      ]}
                      icon={<div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <ArchiveBoxIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">
                      {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                    </span>
                    <span className="hidden sm:inline">
                      Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                    </span>
                  </span>
                </div>
                
                {searchTerm && (
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      <span className="sm:hidden">&quot;{searchTerm}&quot;</span>
                      <span className="hidden sm:inline">Поиск: &quot;{searchTerm}&quot;</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <UsersIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm ? 'Сотрудники не найдены' : 'Нет сотрудников'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Попробуйте изменить критерии поиска' : 'Добавьте первого сотрудника для начала работы'}
              </p>
              {!searchTerm && (
                <button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
                >
                  Добавить сотрудника
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedUsers.map(user => renderUserCard(user))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
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
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Last Page - Hide on mobile */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Последняя страница"
                >
                  <ChevronDoubleLeftIcon className="h-5 w-5 transform rotate-180" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-400">
                <span className="sm:hidden">
                  {totalItems} всего
                </span>
                <span className="hidden sm:inline">
                  {totalItems} сотрудников всего
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-md border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Добавить сотрудника</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] scrollbar-thin">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ФИО
                    </label>
                    <input
                      type="text"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value.slice(0, 25) })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Введите ФИО..."
                      maxLength={25}
                      required
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {formData.fullname.length}/25 символов
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+996700123456"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Пароль
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Введите пароль..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Роль
                    </label>
                    <CustomSelect
                      value={formData.role}
                      onChange={(value) => setFormData({ ...formData, role: value as 'SELLER' | 'COURIER' })}
                      options={[
                        { value: 'SELLER', label: 'Продавец' },
                        { value: 'COURIER', label: 'Курьер' }
                      ]}
                      placeholder="Выберите роль"
                      icon={<UsersIcon className="h-4 w-4" />}
                    />
                  </div>

                  {/* Процент комиссии (только для продавцов) */}
                  {formData.role === 'SELLER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Процент комиссии (%)
                      </label>
                      <input
                        type="number"
                        value={formData.commissionRate || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value >= 0 && value <= 100) {
                            setFormData({ ...formData, commissionRate: value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Процент, который будет добавляться к товарам этого продавца (0-100%)
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModals}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {formLoading ? 'Создание...' : 'Создать'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-md border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Редактировать сотрудника</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] scrollbar-thin">
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ФИО
                    </label>
                    <input
                      type="text"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value.slice(0, 25) })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Введите ФИО..."
                      maxLength={25}
                      required
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {formData.fullname.length}/25 символов
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+996700123456"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Новый пароль (оставьте пустым, если не хотите менять)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Введите новый пароль..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Роль
                    </label>
                    <CustomSelect
                      value={formData.role}
                      onChange={(value) => setFormData({ ...formData, role: value as 'SELLER' | 'COURIER' })}
                      options={[
                        { value: 'SELLER', label: 'Продавец' },
                        { value: 'COURIER', label: 'Курьер' }
                      ]}
                      placeholder="Выберите роль"
                      icon={<UsersIcon className="h-4 w-4" />}
                    />
                  </div>

                  {/* Процент комиссии (только для продавцов) */}
                  {formData.role === 'SELLER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Процент комиссии (%)
                      </label>
                      <input
                        type="number"
                        value={formData.commissionRate || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value >= 0 && value <= 100) {
                            setFormData({ ...formData, commissionRate: value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Процент, который будет добавляться к товарам этого продавца (0-100%)
                      </p>
                    </div>
                  )}

                  {/* Статус */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Статус сотрудника
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <label className={`relative flex items-center p-3 rounded-lg border transition-all duration-200 ${
                        formData.status === 'ACTIVE' 
                          ? 'border-green-500/50 bg-green-500/10' 
                          : 'border-gray-600/50 bg-gray-700/30 hover:border-gray-500/50'
                      } ${formData.status === 'DELETED' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                          type="radio"
                          name="status"
                          value="ACTIVE"
                          checked={formData.status === 'ACTIVE'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'DELETED' })}
                          disabled={formData.status === 'DELETED'}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          formData.status === 'ACTIVE' 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-400 bg-transparent'
                        }`}>
                          {formData.status === 'ACTIVE' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-medium ${
                            formData.status === 'ACTIVE' ? 'text-green-300' : 'text-gray-300'
                          }`}>
                            Активный
                          </span>
                        </div>
                      </label>
                      
                      <label className={`relative flex items-center p-3 rounded-lg border transition-all duration-200 ${
                        formData.status === 'INACTIVE' 
                          ? 'border-yellow-500/50 bg-yellow-500/10' 
                          : 'border-gray-600/50 bg-gray-700/30 hover:border-gray-500/50'
                      } ${formData.status === 'DELETED' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                          type="radio"
                          name="status"
                          value="INACTIVE"
                          checked={formData.status === 'INACTIVE'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'DELETED' })}
                          disabled={formData.status === 'DELETED'}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          formData.status === 'INACTIVE' 
                            ? 'border-yellow-500 bg-yellow-500' 
                            : 'border-gray-400 bg-transparent'
                        }`}>
                          {formData.status === 'INACTIVE' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-medium ${
                            formData.status === 'INACTIVE' ? 'text-yellow-300' : 'text-gray-300'
                          }`}>
                            Неактивный
                          </span>
                        </div>
                      </label>
                    </div>
                    
                    {formData.status === 'DELETED' && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-300">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-sm font-medium">Сотрудник удален</span>
                        </div>
                        <p className="text-xs text-red-400 mt-1">
                          Удаленных сотрудников нельзя активировать через редактирование
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModals}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {formLoading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && deletingUser && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-lg border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Удалить сотрудника</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] scrollbar-thin">
                <div className="mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <TrashIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-yellow-300 mb-2">
                          Подтверждение удаления
                        </h3>
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                          Вы уверены, что хотите удалить сотрудника <span className="font-semibold text-white">&quot;{deletingUser.fullname}&quot;</span>?
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-4 sm:p-6">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-300 text-xs sm:text-sm font-medium mb-1">
                            Внимание
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            Это действие необратимо. Сотрудник будет удален навсегда.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={closeModals}
                    className="flex-1 px-4 sm:px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={formLoading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-red-500/25 text-sm sm:text-base"
                  >
                    {formLoading ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && viewingUser && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-2xl border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Информация о сотруднике</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] scrollbar-thin">
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                          {getRoleIcon(viewingUser.role)}
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                          {viewingUser.fullname}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-sm px-3 py-1 rounded w-fit ${
                              viewingUser.role === 'SELLER' 
                                ? 'text-green-300 bg-green-700/30' 
                                : 'text-blue-300 bg-blue-700/30'
                            }`}>
                              {formatRole(viewingUser.role)}
                            </span>
                            <span className={`text-sm px-3 py-1 rounded border w-fit ${getStatusColor(viewingUser.status)}`}>
                              {formatStatus(viewingUser.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{viewingUser.phoneNumber}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start space-x-1 text-sm text-gray-400">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>Создан {formatDate(viewingUser.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Предупреждение для удаленных пользователей */}
                    {viewingUser.status === 'DELETED' && (
                      <div className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <TrashIcon className="h-4 w-4 text-red-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-red-300 mb-1">Сотрудник удален</h4>
                            <p className="text-xs text-red-400">
                              Данный сотрудник был удален из системы. Редактирование и повторное удаление недоступны.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Статистика */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="bg-gray-600/30 rounded-lg p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          {viewingUser.role === 'SELLER' ? (
                            <CubeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                          ) : (
                            <TruckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                          )}
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {viewingUser.role === 'SELLER' 
                            ? viewingUser._count.products 
                            : viewingUser._count.deliveredOrders
                          }
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {viewingUser.role === 'SELLER' ? 'Товаров' : 'Заказов доставлено'}
                        </div>
                      </div>
                      
                      {/* Процент комиссии для продавцов */}
                      {viewingUser.role === 'SELLER' && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                            </svg>
                          </div>
                          <div className="text-xl sm:text-2xl font-bold text-orange-300">
                            {viewingUser.commissions && viewingUser.commissions.length > 0 
                              ? `${viewingUser.commissions[0].rate}%`
                              : '0%'
                            }
                          </div>
                          <div className="text-xs sm:text-sm text-orange-400">
                            Комиссия
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    }>
      <StaffPageContent />
    </Suspense>
  );
}