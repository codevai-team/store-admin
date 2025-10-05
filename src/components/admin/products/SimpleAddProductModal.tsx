'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
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
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  imageUrl: string[];
  attributes: Record<string, string>;
  sizes: string[];
  colors: string[];
}

interface SimpleAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<boolean>;
  categories: Category[];
  loading: boolean;
  onShowError: (title: string, message: string) => void;
  initialData?: ProductFormData | null;
  isEdit?: boolean;
}

export interface SimpleAddProductModalRef {
  resetImageState: () => void;
}

const SimpleAddProductModal = forwardRef<SimpleAddProductModalRef, SimpleAddProductModalProps>(({
  isOpen,
  onClose,
  onSubmit,
  categories,
  loading,
  onShowError,
  initialData = null,
  isEdit = false
}, ref) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    sellerId: '',
    status: 'ACTIVE',
    imageUrl: [],
    attributes: {},
    sizes: [],
    colors: []
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Отслеживаем загруженные изображения
  const [originalImages, setOriginalImages] = useState<string[]>([]); // Отслеживаем оригинальные изображения
  const [attributes, setAttributes] = useState<{key: string, value: string}[]>([]);
  const [resetImageState, setResetImageState] = useState(false); // Флаг для сброса состояния изображений

  // Функция для проверки валидности формы
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.categoryId !== '' &&
      formData.price > 0 &&
      formData.imageUrl && formData.imageUrl.length > 0 &&
      formData.sizes && formData.sizes.length > 0 &&
      formData.colors && formData.colors.length > 0 &&
      formData.sellerId !== ''
    );
  };

  // Функция для подсчета заполненных полей
  const getFilledFieldsCount = () => {
    let count = 0;
    if (formData.name.trim() !== '') count++;
    if (formData.description.trim() !== '') count++;
    if (formData.categoryId !== '') count++;
    if (formData.price > 0) count++;
    if (formData.imageUrl && formData.imageUrl.length > 0) count++;
    if (formData.sizes && formData.sizes.length > 0) count++;
    if (formData.colors && formData.colors.length > 0) count++;
    return count;
  };

  const totalRequiredFields = 7;
  const filledFields = getFilledFieldsCount();

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Если есть начальные данные, используем их
        setFormData(initialData);
        setOriginalImages(initialData.imageUrl); // Устанавливаем оригинальные изображения
        // Парсим атрибуты из объекта в массив
        if (initialData.attributes) {
          const attributesArray = Object.entries(initialData.attributes).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setAttributes(attributesArray);
        }
      } else if (!formData.sellerId) {
        // Если нет начальных данных, получаем ID администратора
        fetchAdminId();
      }
    }
  }, [isOpen, initialData, formData.sellerId]);

  const fetchAdminId = async () => {
    try {
      const response = await fetch('/api/admin/sellers');
      if (response.ok) {
        const sellers = await response.json();
        const admin = sellers.find((seller: { id: string; role: string }) => seller.role === 'ADMIN');
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

    // Валидация названия товара
    if (!formData.name.trim()) {
      onShowError('Ошибка валидации', 'Название товара обязательно');
      return;
    }

    // Валидация описания
    if (!formData.description.trim()) {
      onShowError('Ошибка валидации', 'Описание товара обязательно');
      return;
    }

    // Валидация категории
    if (!formData.categoryId) {
      onShowError('Ошибка валидации', 'Выберите категорию');
      return;
    }

    // Валидация цены
    if (formData.price <= 0) {
      onShowError('Ошибка валидации', 'Цена должна быть больше 0');
      return;
    }

    // Валидация изображений
    if (!formData.imageUrl || formData.imageUrl.length === 0) {
      onShowError('Ошибка валидации', 'Добавьте хотя бы одно изображение товара');
      return;
    }

    // Валидация размеров
    if (!formData.sizes || formData.sizes.length === 0) {
      onShowError('Ошибка валидации', 'Выберите хотя бы один размер');
      return;
    }

    // Валидация цветов
    if (!formData.colors || formData.colors.length === 0) {
      onShowError('Ошибка валидации', 'Выберите хотя бы один цвет');
      return;
    }

    // Валидация продавца
    if (!formData.sellerId) {
      onShowError('Ошибка валидации', 'Выберите продавца');
      return;
    }

    try {
      const success = await onSubmit(formData);
      if (success) {
        // Очищаем неиспользуемые изображения из S3
        await cleanupUnusedImages();
        
        // Сбрасываем форму только при успешном сохранении
        resetForm();
        // Получаем ID администратора заново для следующего товара
        fetchAdminId();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Функция для очистки неиспользуемых изображений
  const cleanupUnusedImages = async () => {
    try {
      // Собираем все URL, которые были загружены
      const allUploadedUrls: string[] = [...new Set([...uploadedImages, ...originalImages])];
      const finalImageUrls = formData.imageUrl;
      
      // Удаляем неиспользуемые изображения
      const unusedImages = allUploadedUrls.filter((url: string) => !finalImageUrls.includes(url));
      
      if (unusedImages.length > 0) {
        console.log('Deleting unused images:', unusedImages);
        await fetch('/api/upload/cleanup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            urlsToKeep: finalImageUrls,
            urlsToDelete: unusedImages
          }),
        });
      }
    } catch (error) {
      console.error('Error cleaning up images:', error);
      // Не показываем ошибку пользователю, так как это не критично
    }
  };



  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      price: 0,
      sellerId: '', // Будет установлен автоматически при открытии модального окна
      status: 'ACTIVE',
      imageUrl: [],
      attributes: {},
      sizes: [],
      colors: []
    });
    setUploadedImages([]);
    setOriginalImages([]);
    setAttributes([]);
    setResetImageState(true); // Сбрасываем состояние изображений
  };

  const handleClose = async () => {
    if (!isEdit) {
      // При создании товара удаляем все загруженные изображения
      const allImages = [...new Set([...uploadedImages, ...originalImages, ...formData.imageUrl])];
      
      for (const imageUrl of allImages) {
        try {
          await fetch(`/api/upload?fileUrl=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    } else {
      // При редактировании удаляем только новые изображения
      const initialImages = originalImages || [];
      const newImages = uploadedImages.filter(img => !initialImages.includes(img));
      
      console.log('Initial images:', initialImages);
      console.log('Uploaded images:', uploadedImages);
      console.log('New images to delete:', newImages);
      
      for (const imageUrl of newImages) {
        try {
          await fetch(`/api/upload?fileUrl=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    }
    
    resetForm();
    onClose();
  };

  // Отслеживаем изменения изображений
  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, imageUrl: images }));
    setUploadedImages(images);
    
    // Обновляем оригинальные изображения только при добавлении новых
    if (images.length > originalImages.length) {
      const newOriginalImages = [...originalImages];
      for (let i = originalImages.length; i < images.length; i++) {
        newOriginalImages[i] = images[i];
      }
      setOriginalImages(newOriginalImages);
    }
  };

  const addAttribute = () => {
    setAttributes(prev => [...prev, { key: '', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
    setAttributes(prev => 
      prev.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    );
  };

  // Обновляем formData.attributes при изменении атрибутов
  useEffect(() => {
    const attributesObject = attributes.reduce((acc, attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        acc[attr.key.trim()] = attr.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({ ...prev, attributes: attributesObject }));
  }, [attributes]);

  // Сброс флага resetImageState после сброса состояния
  useEffect(() => {
    if (resetImageState) {
      const timer = setTimeout(() => {
        setResetImageState(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [resetImageState]);

  // Экспорт функции сброса состояния изображений
  useImperativeHandle(ref, () => ({
    resetImageState: () => {
      setResetImageState(true);
    }
  }), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-[9999] safe-area-inset">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-2xl border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate pr-4">{isEdit ? 'Редактировать товар' : 'Добавить товар'}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-thin">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Основная информация</h3>
            
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название товара <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.slice(0, 25) }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Введите название товара"
                maxLength={25}
                required
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {formData.name.length}/25 символов
                </span>
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value.slice(0, 200) }))}
                rows={3}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                maxLength={200}
                placeholder="Описание товара"
                required
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {formData.description.length}/200 символов
                </span>
              </div>
            </div>

            {/* Цена */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цена <span className="text-red-400">*</span>
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
                  placeholder="Введите цену в сомах"
                  required
                />
              </div>
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Категория <span className="text-red-400">*</span>
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

            {/* Статус */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Статус
              </label>
              <CustomSelect
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as 'ACTIVE' | 'INACTIVE' | 'DELETED' }))}
                options={isEdit && formData.status === 'DELETED' ? [
                  { value: 'DELETED', label: 'Удаленный (нельзя изменить)' }
                ] : [
                  { value: 'ACTIVE', label: 'Активный' },
                  { value: 'INACTIVE', label: 'Неактивный' },
                  { value: 'DELETED', label: 'Удаленный' }
                ]}
                placeholder="Выберите статус"
                icon={
                  <div className={`h-3 w-3 rounded-full ${
                    formData.status === 'ACTIVE' 
                      ? 'bg-green-400' 
                      : formData.status === 'INACTIVE'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`} />
                }
                disabled={isEdit && formData.status === 'DELETED'}
              />
            </div>

            {/* Продавец скрыт - автоматически устанавливается администратор */}
          </div>

          {/* Изображения */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Изображения <span className="text-red-400">*</span></h3>
            <ImageUpload
              images={formData.imageUrl}
              onImagesChange={handleImagesChange}
              maxImages={5}
              resetState={resetImageState}
            />
          </div>

          {/* Размеры */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Размеры <span className="text-red-400">*</span></h3>
            <SizeSelector
              selectedSizes={formData.sizes}
              onSizesChange={(sizes) => setFormData(prev => ({ ...prev, sizes }))}
            />
          </div>

          {/* Цвета */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Цвета <span className="text-red-400">*</span></h3>
            <ColorSelector
              selectedColors={formData.colors}
              onColorsChange={(colors) => setFormData(prev => ({ ...prev, colors }))}
            />
          </div>

          {/* Атрибуты */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Атрибуты</h3>
            
            <div className="space-y-3">
              {attributes.map((attr, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Поля атрибутов - вертикально на мобильных, горизонтально на десктопе */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Название атрибута"
                        value={attr.key}
                        onChange={(e) => updateAttribute(index, 'key', e.target.value.slice(0, 15))}
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        maxLength={15}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">
                          {attr.key.length}/15 символов
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Значение атрибута"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value.slice(0, 15))}
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        maxLength={15}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">
                          {attr.value.length}/15 символов
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Кнопка удаления */}
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="self-center sm:self-auto p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Удалить атрибут"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addAttribute}
                className="w-full p-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Добавить атрибут</span>
              </button>
            </div>
          </div>

          {/* Индикатор прогресса */}
          {!isEdit && (
            <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-300">
                  Заполнено полей: {filledFields} из {totalRequiredFields}
                </span>
                <span className="text-xs text-gray-400 self-start sm:self-auto">
                  {Math.round((filledFields / totalRequiredFields) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-600/50 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(filledFields / totalRequiredFields) * 100}%` }}
                ></div>
              </div>
              {!isFormValid() && (
                <p className="text-xs text-gray-400 leading-tight">
                  <span className="hidden sm:inline">Заполните все обязательные поля для активации кнопки создания</span>
                  <span className="sm:hidden">Заполните все поля со звездочкой (*)</span>
                </p>
              )}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 pb-4 sm:pb-0 border-t border-gray-700/50">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 sm:py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium active:scale-95 touch-manipulation"
            >
              Отмена
            </button>
            <div className="flex-1 relative">
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`w-full px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 ${
                  loading || !isFormValid()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60 select-none'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-lg hover:shadow-indigo-500/25 active:scale-95 touch-manipulation'
                }`}
                title={!isFormValid() && !loading ? 'Заполните все обязательные поля' : ''}
              >
                {loading ? (isEdit ? 'Сохранение...' : 'Создание...') : (isEdit ? 'Сохранить' : 'Создать товар')}
              </button>
              
              {/* Индикатор для мобильных под кнопкой */}
              {!isEdit && !isFormValid() && !loading && (
                <div className="sm:hidden mt-2 text-center">
                  <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-700/30">
                    Осталось заполнить: {totalRequiredFields - filledFields} полей
                  </span>
                </div>
              )}
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
});

SimpleAddProductModal.displayName = 'SimpleAddProductModal';

export default SimpleAddProductModal;
