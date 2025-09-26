'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  SwatchIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  HashtagIcon,
  PercentBadgeIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';

import ColorPicker from './ColorPicker';
import SizePicker from './SizePicker';
import ImageUploadModal from './ImageUploadModal';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  attributes: { name: string; value: string }[];
  images: string[];
}

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  variants: ProductVariant[];
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  categories: Category[];
  loading?: boolean;
  onShowWarning?: (title: string, message: string) => void;
  onShowError?: (title: string, message: string) => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  loading = false,
  onShowWarning,
  onShowError
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    isActive: true,
    variants: []
  });

  const [currentVariant, setCurrentVariant] = useState<ProductVariant>({
    id: '',
    size: '',
    color: '',
    sku: '',
    quantity: 0,
    price: 0,
    attributes: [],
    images: []
  });

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        isActive: true,
        variants: []
      });
      setCurrentVariant({
        id: '',
        size: '',
        color: '',
        sku: '',
        quantity: 0,
        price: 0,
        attributes: [],
        images: []
      });
      setShowVariantForm(false);
      setEditingVariantIndex(null);
      setShowDiscount(false);
      setNewAttribute({ name: '', value: '' });
    }
  }, [isOpen]);



  const handleVariantSave = () => {
    if (!currentVariant.size || !currentVariant.color || currentVariant.price <= 0) {
      onShowWarning?.('Не все поля заполнены', 'Пожалуйста, заполните размер, цвет и цену варианта');
      return;
    }

    const variant = {
      ...currentVariant,
      id: editingVariantIndex !== null 
        ? formData.variants[editingVariantIndex].id 
        : Date.now().toString()
    };

    if (editingVariantIndex !== null) {
      const newVariants = [...formData.variants];
      newVariants[editingVariantIndex] = variant;
      setFormData({ ...formData, variants: newVariants });
    } else {
      setFormData({ ...formData, variants: [...formData.variants, variant] });
    }

    // Reset form
    setCurrentVariant({
      id: '',
      size: '',
      color: '',
      sku: '',
      quantity: 0,
      price: 0,
      attributes: [],
      images: []
    });
    setShowVariantForm(false);
    setEditingVariantIndex(null);
    setShowDiscount(false);
  };

  const handleVariantEdit = (index: number) => {
    setCurrentVariant(formData.variants[index]);
    setEditingVariantIndex(index);
    setShowVariantForm(true);
    setShowDiscount(!!formData.variants[index].discountPrice);
  };

  const handleVariantDelete = (index: number) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleAddAttribute = () => {
    if (!newAttribute.name.trim() || !newAttribute.value.trim()) return;
    
    const newAttr = { name: newAttribute.name.trim(), value: newAttribute.value.trim() };
    
    setCurrentVariant(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttr]
    }));
    
    setNewAttribute({ name: '', value: '' });
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = currentVariant.attributes.filter((_, i) => i !== index);
    setCurrentVariant({ ...currentVariant, attributes: newAttributes });
  };

  const handleImagesUpdate = (images: string[]) => {
    setCurrentVariant({ ...currentVariant, images });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.categoryId) {
      onShowError?.('Не все поля заполнены', 'Пожалуйста, заполните название и выберите категорию');
      return;
    }

    if (formData.variants.length === 0) {
      onShowError?.('Нет вариантов товара', 'Добавьте хотя бы один вариант товара');
      return;
    }

    try {
      await onSubmit(formData);
      // Сначала закрываем модальное окно
      onClose();
    } catch (error) {
      onShowError?.('Ошибка создания', 'Не удалось создать товар. Попробуйте еще раз');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
      <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Добавить товар</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(92vh-120px)]">
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-4 border border-gray-700/30">
              <h3 className="text-base font-medium text-white flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                  <DocumentTextIcon className="h-3 w-3 text-white" />
                </div>
                <span>Основная информация</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Введите название товара"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Категория *
                  </label>
                  <div className="relative">
                    <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none transition-colors"
                      required
                    >
                      <option value="" className="bg-gray-800">Выберите категорию</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id} className="bg-gray-800">
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronUpDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mt-3">
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Введите описание товара"
                    rows={2}
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Статус
                  </label>
                  <div className="flex items-center justify-between p-3 bg-gray-800/40 border border-gray-600/30 rounded-lg h-[60px]">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${formData.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white block">
                          {formData.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formData.isActive ? 'Виден' : 'Скрыт'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        formData.isActive ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          formData.isActive ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-white flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center">
                    <CubeIcon className="h-3 w-3 text-white" />
                  </div>
                  <span>Варианты товара</span>
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">
                    {formData.variants.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVariantForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1.5 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-lg"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Добавить</span>
                </button>
              </div>

              {/* Variants List */}
              {formData.variants.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {formData.variants.map((variant, index) => (
                    <div key={variant.id} className="bg-gray-800/50 border border-gray-700/40 rounded-lg p-3 hover:bg-gray-800/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 text-sm">
                            <div className="flex items-center space-x-1.5">
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-600 shadow-sm"
                                style={{ backgroundColor: variant.color }}
                              />
                              <span className="text-white font-medium text-xs">{variant.size}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-gray-400">
                                {variant.sku ? `SKU: ${variant.sku}` : 'No SKU'}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-400">{variant.quantity} шт</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-green-400 font-semibold">{variant.price} ₽</span>
                              {variant.discountPrice && (
                                <>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-orange-400 font-semibold">{variant.discountPrice} ₽</span>
                                </>
                              )}
                            </div>
                          </div>
                          {variant.attributes.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {variant.attributes.map((attr, attrIndex) => (
                                <span key={attrIndex} className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded">
                                  {attr.name}: {attr.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-3">
                          <button
                            type="button"
                            onClick={() => handleVariantEdit(index)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-200"
                          >
                            <PaintBrushIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVariantDelete(index)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Form */}
              {showVariantForm && (
                <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 space-y-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white text-sm flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
                        <AdjustmentsHorizontalIcon className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span>{editingVariantIndex !== null ? 'Редактировать вариант' : 'Новый вариант'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVariantForm(false);
                        setEditingVariantIndex(null);
                        setCurrentVariant({
                          id: '',
                          size: '',
                          color: '',
                          sku: '',
                          quantity: 0,
                          price: 0,
                          attributes: [],
                          images: []
                        });
                        setShowDiscount(false);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* First Row: Color & Size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Цвет *
                        </label>
                        <ColorPicker
                          selectedColor={currentVariant.color}
                          onColorChange={(color) => setCurrentVariant({ ...currentVariant, color })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Размер *
                        </label>
                        <SizePicker
                          selectedSize={currentVariant.size}
                          onSizeChange={(size) => setCurrentVariant({ ...currentVariant, size })}
                        />
                      </div>
                    </div>

                    {/* Second Row: SKU, Quantity, Price */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Артикул (SKU)
                        </label>
                        <input
                          type="text"
                          value={currentVariant.sku}
                          onChange={(e) => setCurrentVariant({ ...currentVariant, sku: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="SKU"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Количество *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentVariant.quantity}
                          onChange={(e) => setCurrentVariant({ ...currentVariant, quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Цена * ₽
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentVariant.price}
                          onChange={(e) => setCurrentVariant({ ...currentVariant, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Third Row: Discount */}
                    <div>
                      {!showDiscount ? (
                        <button
                          type="button"
                          onClick={() => setShowDiscount(true)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1.5 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 text-sm font-medium"
                        >
                          <PercentBadgeIcon className="h-3.5 w-3.5" />
                          <span>Добавить скидку</span>
                        </button>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Цена со скидкой ₽
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentVariant.discountPrice || ''}
                              onChange={(e) => setCurrentVariant({ 
                                ...currentVariant, 
                                discountPrice: parseFloat(e.target.value) || undefined 
                              })}
                              className="flex-1 px-3 py-2 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                              placeholder="0.00"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowDiscount(false);
                                setCurrentVariant({ ...currentVariant, discountPrice: undefined });
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-gray-400">
                        Дополнительные атрибуты
                      </label>
                      <button
                        type="button"
                        onClick={handleAddAttribute}
                        disabled={!newAttribute.name.trim() || !newAttribute.value.trim()}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-3 w-3" />
                        <span>Добавить</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newAttribute.name}
                        onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                        className="px-2 py-1.5 bg-gray-800/60 border border-gray-600/50 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="Название"
                      />
                      <input
                        type="text"
                        value={newAttribute.value}
                        onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                        className="px-2 py-1.5 bg-gray-800/60 border border-gray-600/50 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="Значение"
                      />
                    </div>

                    {currentVariant.attributes.length > 0 && (
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {currentVariant.attributes.map((attr, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-800/40 rounded px-2 py-1.5 border border-gray-700/30">
                            <span className="text-xs text-gray-300">
                              <span className="font-medium text-white">{attr.name}:</span> {attr.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttribute(index)}
                              className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-gray-400">
                        Фотографии ({currentVariant.images.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                      >
                        <PhotoIcon className="h-3 w-3" />
                        <span>Добавить</span>
                      </button>
                    </div>
                    
                    {currentVariant.images.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
                        {currentVariant.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-12 rounded border border-gray-600/50 overflow-hidden bg-gray-700">
                              <img
                                src={image}
                                alt={`Фото ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = currentVariant.images.filter((_, i) => i !== index);
                                setCurrentVariant({ ...currentVariant, images: newImages });
                              }}
                              className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <XMarkIcon className="h-2 w-2" />
                            </button>
                            <div className="absolute bottom-0.5 left-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Variant Actions */}
                  <div className="flex space-x-2 pt-3 border-t border-gray-700/30">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVariantForm(false);
                        setEditingVariantIndex(null);
                        setCurrentVariant({
                          id: '',
                          size: '',
                          color: '',
                          sku: '',
                          quantity: 0,
                          price: 0,
                          attributes: [],
                          images: []
                        });
                        setShowDiscount(false);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-700/50 hover:text-gray-300 transition-all duration-200 text-sm font-medium"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleVariantSave}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-lg"
                    >
                      {editingVariantIndex !== null ? 'Сохранить' : 'Добавить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 px-5 py-3 bg-gradient-to-r from-gray-800/60 to-gray-900/60 border-t border-gray-700/30 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-700/50 hover:text-gray-300 hover:border-gray-500/50 transition-all duration-200 text-sm font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.variants.length === 0}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Создание...</span>
              </>
            ) : (
              <>
                <CubeIcon className="h-4 w-4" />
                <span>Создать товар</span>
              </>
            )}
          </button>
        </div>

        {/* Image Upload Modal */}
        {showImageModal && (
          <ImageUploadModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            onImagesUpdate={handleImagesUpdate}
            currentImages={currentVariant.images}
          />
        )}


      </div>
    </div>
  );
}
