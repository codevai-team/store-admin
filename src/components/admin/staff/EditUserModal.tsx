'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  user: User | null;
  loading?: boolean;
}

interface UserFormData {
  name: string;
  phone: string;
  role: string;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  loading = false,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    phone: '',
    role: 'MANAGER',
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  // Заполнение формы при открытии
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        phone: user.phone,
        role: user.role,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: Partial<UserFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'ФИО обязательно';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
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
      name: '',
      phone: '',
      role: 'MANAGER',
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
      case 'MANAGER':
        return 'Менеджер';
      default:
        return role;
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
      <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-4 w-4 text-white" />
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                ФИО *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.name ? 'border-red-500' : 'border-gray-600/50'
                }`}
                placeholder="Иванов Иван Иванович"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Телефон *
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.phone ? 'border-red-500' : 'border-gray-600/50'
                }`}
                placeholder="+7 (777) 123-45-67"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
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
                <option value="MANAGER">Менеджер</option>
              </select>
            </div>

            {/* Статистика */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Статистика сотрудника</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-white">{user._count.shifts}</div>
                  <div className="text-xs text-gray-400">Всего смен</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatDate(user.createdAt)}
                  </div>
                  <div className="text-xs text-gray-400">Дата регистрации</div>
                </div>
              </div>
              
              {/* Последние смены */}
              {user.shifts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Последние смены
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {user.shifts.slice(0, 3).map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-xs">
                        <div>
                          <div className="text-white font-medium">{shift.store.name}</div>
                          <div className="text-gray-400 flex items-center">
                            <CalendarDaysIcon className="h-3 w-3 mr-1" />
                            {formatDate(shift.startedAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            shift.endedAt 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {shift.endedAt ? 'Завершена' : 'Активна'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
