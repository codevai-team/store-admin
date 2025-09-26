'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import AddStoreModal from '@/components/admin/staff/AddStoreModal';
import EditStoreModal from '@/components/admin/staff/EditStoreModal';
import AddUserModal from '@/components/admin/staff/AddUserModal';
import EditUserModal from '@/components/admin/staff/EditUserModal';
import DeleteConfirmModal from '@/components/admin/staff/DeleteConfirmModal';

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    shifts: number;
    orders: number;
  };
}

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
  _count: {
    shifts: number;
  };
  shifts: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    store: {
      id: string;
      name: string;
    };
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

type ActiveTab = 'stores' | 'users';
type SortOrder = 'asc' | 'desc';

export default function StaffPage() {
  // Состояние вкладок
  const [activeTab, setActiveTab] = useState<ActiveTab>('stores');

  // Состояние филиалов
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesSearch, setStoresSearch] = useState('');
  const [storesCurrentPage, setStoresCurrentPage] = useState(1);
  const [storesSortBy, setStoresSortBy] = useState('createdAt');
  const [storesSortOrder, setStoresSortOrder] = useState<SortOrder>('desc');
  const [storesActiveFilter, setStoresActiveFilter] = useState<string>('');
  const [storesPagination, setStoresPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Состояние сотрудников
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersSortBy, setUsersSortBy] = useState('createdAt');
  const [usersSortOrder, setUsersSortOrder] = useState<SortOrder>('desc');
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>('');
  const [usersPagination, setUsersPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Модальные окна
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'store' | 'user';
    item: Store | User;
  } | null>(null);

  const [formLoading, setFormLoading] = useState(false);

  // Загрузка филиалов
  const fetchStores = async () => {
    try {
      setStoresLoading(true);
      const params = new URLSearchParams({
        page: storesCurrentPage.toString(),
        limit: storesPagination.itemsPerPage.toString(),
        search: storesSearch,
        sortBy: storesSortBy,
        sortOrder: storesSortOrder,
      });

      if (storesActiveFilter) {
        params.set('isActive', storesActiveFilter);
      }

      const response = await fetch(`/api/admin/stores?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores);
        setStoresPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setStoresLoading(false);
    }
  };

  // Загрузка сотрудников
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({
        page: usersCurrentPage.toString(),
        limit: usersPagination.itemsPerPage.toString(),
        search: usersSearch,
        sortBy: usersSortBy,
        sortOrder: usersSortOrder,
      });

      if (usersRoleFilter) {
        params.set('role', usersRoleFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUsersPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Эффекты для загрузки данных
  useEffect(() => {
    fetchStores();
  }, [storesCurrentPage, storesSearch, storesSortBy, storesSortOrder, storesActiveFilter]);

  useEffect(() => {
    fetchUsers();
  }, [usersCurrentPage, usersSearch, usersSortBy, usersSortOrder, usersRoleFilter]);

  // Обработчики для филиалов
  const handleCreateStore = async (storeData: any) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });

      if (response.ok) {
        setIsAddStoreModalOpen(false);
        fetchStores();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при создании филиала');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Ошибка при создании филиала');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditStore = async (storeData: any) => {
    if (!editingStore) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/admin/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });

      if (response.ok) {
        setIsEditStoreModalOpen(false);
        setEditingStore(null);
        fetchStores();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при обновлении филиала');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Ошибка при обновлении филиала');
    } finally {
      setFormLoading(false);
    }
  };

  // Обработчики для сотрудников
  const handleCreateUser = async (userData: any) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsAddUserModalOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при создании сотрудника');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Ошибка при создании сотрудника');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при обновлении сотрудника');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Ошибка при обновлении сотрудника');
    } finally {
      setFormLoading(false);
    }
  };

  // Обработчик удаления
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setFormLoading(true);
      const endpoint = deleteTarget.type === 'store' 
        ? `/api/admin/stores/${deleteTarget.item.id}`
        : `/api/admin/users/${deleteTarget.item.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        if (deleteTarget.type === 'store') {
          fetchStores();
        } else {
          fetchUsers();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при удалении');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Ошибка при удалении');
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
      case 'MANAGER':
        return 'Менеджер';
      default:
        return role;
    }
  };

  // Компонент пагинации
  const Pagination = ({ 
    pagination, 
    onPageChange 
  }: { 
    pagination: PaginationInfo; 
    onPageChange: (page: number) => void; 
  }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-t border-gray-700/50">
      <div className="flex items-center text-sm text-gray-300">
        <span>
          Показано {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} из {pagination.totalItems}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={pagination.currentPage === 1}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronDoubleLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="px-3 py-1 text-sm text-white bg-gray-700/50 rounded-lg">
          {pagination.currentPage} из {pagination.totalPages}
        </span>
        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(pagination.totalPages)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronDoubleRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Компонент заголовка сортируемой колонки
  const SortableHeader = ({ 
    label, 
    sortKey, 
    currentSortBy, 
    currentSortOrder, 
    onSort 
  }: {
    label: string;
    sortKey: string;
    currentSortBy: string;
    currentSortOrder: SortOrder;
    onSort: (key: string) => void;
  }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {currentSortBy === sortKey && (
          currentSortOrder === 'asc' 
            ? <BarsArrowUpIcon className="h-4 w-4" />
            : <BarsArrowDownIcon className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  // Обработчик сортировки для филиалов
  const handleStoreSort = (sortKey: string) => {
    if (storesSortBy === sortKey) {
      setStoresSortOrder(storesSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStoresSortBy(sortKey);
      setStoresSortOrder('asc');
    }
  };

  // Обработчик сортировки для сотрудников
  const handleUserSort = (sortKey: string) => {
    if (usersSortBy === sortKey) {
      setUsersSortOrder(usersSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUsersSortBy(sortKey);
      setUsersSortOrder('asc');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <h1 className="text-3xl font-bold text-white mb-2">
            Сотрудники и филиалы
          </h1>
          <p className="text-gray-300">
            Управление персоналом и филиалами магазина
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <div className="border-b border-gray-700/50">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('stores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'stores'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-5 w-5" />
                  <span>Филиалы ({storesPagination.totalItems})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>Сотрудники ({usersPagination.totalItems})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Stores Tab */}
          {activeTab === 'stores' && (
            <div className="p-6">
              {/* Stores Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск филиалов..."
                      value={storesSearch}
                      onChange={(e) => setStoresSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 w-full sm:w-64"
                    />
                  </div>

                  {/* Active Filter */}
                  <select
                    value={storesActiveFilter}
                    onChange={(e) => setStoresActiveFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Все филиалы</option>
                    <option value="true">Активные</option>
                    <option value="false">Неактивные</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsAddStoreModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Добавить филиал
                </button>
              </div>

              {/* Stores Table */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
                {storesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700/50">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <SortableHeader
                              label="Название"
                              sortKey="name"
                              currentSortBy={storesSortBy}
                              currentSortOrder={storesSortOrder}
                              onSort={handleStoreSort}
                            />
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Адрес
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Контакты
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Статус
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Смены
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Заказы
                            </th>
                            <SortableHeader
                              label="Создан"
                              sortKey="createdAt"
                              currentSortBy={storesSortBy}
                              currentSortOrder={storesSortOrder}
                              onSort={handleStoreSort}
                            />
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/20 divide-y divide-gray-700/50">
                          {stores.map((store) => (
                            <tr key={store.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <BuildingOfficeIcon className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-white">{store.name}</div>
                                    <div className="text-sm text-gray-400">{store.location}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-start">
                                  <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                                  <div className="text-sm text-gray-300 leading-5">{store.address}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <div className="text-sm text-gray-300">{store.phone}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  store.isActive
                                    ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                                    : 'bg-red-900/50 text-red-300 border border-red-700/50'
                                }`}>
                                  {store.isActive ? 'Активен' : 'Неактивен'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {store._count.shifts}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {store._count.orders}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {formatDate(store.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingStore(store);
                                      setIsEditStoreModalOpen(true);
                                    }}
                                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                                    title="Редактировать"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteTarget({ type: 'store', item: store });
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                                    title="Удалить"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {stores.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center">
                                  <BuildingOfficeIcon className="h-12 w-12 text-gray-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">Филиалы не найдены</p>
                                  <p className="text-gray-500 text-sm">Попробуйте изменить параметры поиска</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {stores.length > 0 && (
                      <Pagination 
                        pagination={storesPagination} 
                        onPageChange={setStoresCurrentPage} 
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="p-6">
              {/* Users Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск по ФИО или номеру..."
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 w-full sm:w-64"
                    />
                  </div>

                  {/* Role Filter */}
                  <select
                    value={usersRoleFilter}
                    onChange={(e) => setUsersRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Все роли</option>
                    <option value="MANAGER">Менеджер</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Добавить сотрудника
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700/50">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <SortableHeader
                              label="ФИО"
                              sortKey="name"
                              currentSortBy={usersSortBy}
                              currentSortOrder={usersSortOrder}
                              onSort={handleUserSort}
                            />
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Телефон
                            </th>
                            <SortableHeader
                              label="Роль"
                              sortKey="role"
                              currentSortBy={usersSortBy}
                              currentSortOrder={usersSortOrder}
                              onSort={handleUserSort}
                            />
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Смены
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Последняя смена
                            </th>
                            <SortableHeader
                              label="Зарегистрирован"
                              sortKey="createdAt"
                              currentSortBy={usersSortBy}
                              currentSortOrder={usersSortOrder}
                              onSort={handleUserSort}
                            />
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/20 divide-y divide-gray-700/50">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <UsersIcon className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <div className="text-sm text-gray-300">{user.phone}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50">
                                  {formatRole(user.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {user._count.shifts}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {user.shifts.length > 0 ? (
                                  <div>
                                    <div className="text-white">{user.shifts[0].store.name}</div>
                                    <div className="text-xs text-gray-400 flex items-center">
                                      <ClockIcon className="h-3 w-3 mr-1" />
                                      {formatDate(user.shifts[0].startedAt)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Нет смен</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {formatDate(user.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setIsEditUserModalOpen(true);
                                    }}
                                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                                    title="Редактировать"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteTarget({ type: 'user', item: user });
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                                    title="Удалить"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center">
                                  <UsersIcon className="h-12 w-12 text-gray-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">Сотрудники не найдены</p>
                                  <p className="text-gray-500 text-sm">Попробуйте изменить параметры поиска</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {users.length > 0 && (
                      <Pagination 
                        pagination={usersPagination} 
                        onPageChange={setUsersCurrentPage} 
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddStoreModal
        isOpen={isAddStoreModalOpen}
        onClose={() => setIsAddStoreModalOpen(false)}
        onSubmit={handleCreateStore}
        loading={formLoading}
      />

      <EditStoreModal
        isOpen={isEditStoreModalOpen}
        onClose={() => {
          setIsEditStoreModalOpen(false);
          setEditingStore(null);
        }}
        onSubmit={handleEditStore}
        store={editingStore}
        loading={formLoading}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleCreateUser}
        loading={formLoading}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleEditUser}
        user={editingUser}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        target={deleteTarget}
        loading={formLoading}
      />
    </AdminLayout>
  );
}
