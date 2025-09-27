'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UsersIcon,
  ShoppingBagIcon,
  TruckIcon,
  CalendarDaysIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  fullname: string;
  phoneNumber: string;
  role: string;
  status: string;
  createdAt: string;
  _count: {
    products: number;
    deliveredOrders: number;
  };
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  user: User | null;
  loading?: boolean;
}

interface UserFormData {
  fullname: string;
  phoneNumber: string;
  role: string;
  status: string;
  password: string;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  loading = false,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    fullname: '',
    phoneNumber: '',
    role: 'SELLER',
    status: 'ACTIVE',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  // Заполнение формы при открытии
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullname: user.fullname,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        password: '',
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: Partial<UserFormData> = {};
    
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'ФИО обязательно';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Телефон обязателен';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Неверный формат телефона';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      fullname: '',
      phoneNumber: '',
      role: 'SELLER',
      status: 'ACTIVE',
      password: '',
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
      <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              {getRoleIcon(user.role)}
            </div>
            <h2 className="text-lg font-semibold text-white">Редактировать сотрудника</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(92vh-80px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* ФИО */}
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-300 mb-2">
                ФИО *
              </label>
              <input
                type="text"
                id="fullname"
                value={formData.fullname}
                onChange={(e) => handleInputChange('fullname', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.fullname ? 'border-red-500' : 'border-gray-600/50'
                }`}
                placeholder="Иванов Иван Иванович"
              />
              {errors.fullname && (
                <p className="mt-1 text-sm text-red-400">{errors.fullname}</p>
              )}
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                Телефон *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-600/50'
                }`}
                placeholder="+996700123456"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Новый пароль (оставьте пустым, если не хотите менять)
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                placeholder="Введите новый пароль..."
              />
            </div>

            {/* Роль */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                Роль
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="SELLER">Продавец</option>
                <option value="COURIER">Курьер</option>
              </select>
            </div>

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
                    onChange={(e) => handleInputChange('status', e.target.value)}
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
                    onChange={(e) => handleInputChange('status', e.target.value)}
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

            {/* Статистика */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Статистика сотрудника</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-white">{user._count.products}</div>
                  <div className="text-xs text-gray-400">Товаров</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{user._count.deliveredOrders}</div>
                  <div className="text-xs text-gray-400">Заказов доставлено</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Зарегистрирован: {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}