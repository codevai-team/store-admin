'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: any) => void;
  loading?: boolean;
}

interface StoreFormData {
  name: string;
  address: string;
  phone: string;
  location: string;
  isActive: boolean;
}

export default function AddStoreModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: AddStoreModalProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    address: '',
    phone: '',
    location: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Partial<StoreFormData>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: Partial<StoreFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Адрес обязателен';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Местоположение обязательно';
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
      address: '',
      phone: '',
      location: '',
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof StoreFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
      <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Добавить филиал</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Название */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Название филиала *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                errors.name ? 'border-red-500' : 'border-gray-600/50'
              }`}
              placeholder="Например: Филиал на Абая"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Адрес */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
              Адрес *
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 resize-none ${
                errors.address ? 'border-red-500' : 'border-gray-600/50'
              }`}
              placeholder="Полный адрес филиала"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-400">{errors.address}</p>
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

          {/* Местоположение */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
              Местоположение *
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                errors.location ? 'border-red-500' : 'border-gray-600/50'
              }`}
              placeholder="Например: Центр города, ТРЦ Мега"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-400">{errors.location}</p>
            )}
          </div>

          {/* Статус */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-300">
                Филиал активен
              </span>
            </label>
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
              <span>{loading ? 'Создание...' : 'Создать филиал'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
