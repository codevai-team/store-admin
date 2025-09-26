'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import CustomSelect from './CustomSelect';
import ImageUpload from './ImageUpload';
import SizeSelector from './SizeSelector';
import ColorSelector from './ColorSelector';

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  sellerId: string;
  imageUrl: string[];
  attributes: any;
  sizes: string[];
  colors: string[];
}

interface SimpleAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<boolean>;
  categories: Category[];
  loading: boolean;
  onShowWarning: (title: string, message: string) => void;
  onShowError: (title: string, message: string) => void;
}

export default function SimpleAddProductModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  loading,
  onShowWarning,
  onShowError
}: SimpleAddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    sellerId: '',
    imageUrl: [],
    attributes: {},
    sizes: [],
    colors: []
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Отслеживаем загруженные изображения

  // Получаем ID администратора из API
  useEffect(() => {
    if (isOpen && !formData.sellerId) {
      fetchAdminId();
    }
  }, [isOpen]);

  const fetchAdminId = async () => {
    try {
      const response = await fetch('/api/admin/sellers');
      if (response.ok) {
        const sellers = await response.json();
        const admin = sellers.find((seller: any) => seller.role === 'ADMIN');
        if (admin) {
          setFormData(prev => ({
            ...prev,
            sellerId: admin.id
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      onShowError('Ошибка валидации', 'Название товара обязательно');
      return;
    }

    if (!formData.categoryId) {
      onShowError('Ошибка валидации', 'Выберите категорию');
      return;
    }

    if (formData.price <= 0) {
      onShowError('Ошибка валидации', 'Цена должна быть больше 0');
      return;
    }

    if (!formData.sellerId) {
      onShowError('Ошибка валидации', 'Выберите продавца');
      return;
    }

    try {
      const success = await onSubmit(formData);
      if (success) {
        // Сбрасываем форму только при успешном сохранении
        resetForm();
        // Получаем ID администратора заново для следующего товара
        fetchAdminId();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };



  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      price: 0,
      sellerId: '', // Будет установлен автоматически при открытии модального окна
      imageUrl: [],
      attributes: {},
      sizes: [],
      colors: []
    });
    setUploadedImages([]);
  };

  const handleClose = async () => {
    // Удаляем загруженные изображения, если товар не был сохранен
    for (const imageUrl of uploadedImages) {
      try {
        await fetch(`/api/upload?fileUrl=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    
    resetForm();
    onClose();
  };

  // Отслеживаем изменения изображений
  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, imageUrl: images }));
    setUploadedImages(images);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-2xl border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Добавить товар</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Основная информация</h3>
            
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название товара *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Введите название товара"
                required
              />
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Описание товара"
              />
            </div>

            {/* Цена */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цена *
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      price: value === '' ? 0 : parseFloat(value) || 0 
                    }));
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setFormData(prev => ({ ...prev, price: 0 }));
                    }
                  }}
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Введите цену"
                  required
                />
              </div>
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Категория *
              </label>
              <CustomSelect
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                options={[
                  { value: '', label: 'Выберите категорию' },
                  ...categories
                    .filter(category => !category.parentId)
                    .flatMap(category => [
                      { value: category.id, label: category.name },
                      ...categories
                        .filter(subcat => subcat.parentId === category.id)
                        .map(subcategory => ({
                          value: subcategory.id,
                          label: `├─ ${subcategory.name}`
                        }))
                    ])
                ]}
                placeholder="Выберите категорию"
                icon={<TagIcon className="h-5 w-5" />}
              />
            </div>

            {/* Продавец скрыт - автоматически устанавливается администратор */}
          </div>

          {/* Изображения */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Изображения</h3>
            <ImageUpload
              images={formData.imageUrl}
              onImagesChange={handleImagesChange}
              maxImages={5}
            />
          </div>

          {/* Размеры */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Размеры</h3>
            <SizeSelector
              selectedSizes={formData.sizes}
              onSizesChange={(sizes) => setFormData(prev => ({ ...prev, sizes }))}
            />
          </div>

          {/* Цвета */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Цвета</h3>
            <ColorSelector
              selectedColors={formData.colors}
              onColorsChange={(colors) => setFormData(prev => ({ ...prev, colors }))}
            />
          </div>

          {/* Кнопки */}
          <div className="flex space-x-4 pt-4 border-t border-gray-700/50">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
