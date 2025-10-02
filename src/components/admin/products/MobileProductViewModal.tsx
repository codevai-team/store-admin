'use client';

import React from 'react';
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  UserIcon,
  CalendarDaysIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import MobileImageGallery from './MobileImageGallery';

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  category: Category;
  seller?: {
    id: string;
    fullname: string;
  };
  mainImage: string | null;
  imageUrl: any[];
  attributes: any;
  createdAt: string;
  updatedAt: string;
  sizes?: string[];
  colors?: Array<{name: string; colorCode: string}>;
  isActive: boolean;
  variantsCount: number;
  totalQuantity: number;
  minPrice: number;
  maxPrice: number;
  variants: number;
  images: number;
}

interface MobileProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  sellers: {id: string, fullname: string, role: string}[];
}

export default function MobileProductViewModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
  sellers
}: MobileProductViewModalProps) {

  if (!isOpen || !product) return null;

  // Get all images
  const additionalImages = Array.isArray(product.imageUrl) 
    ? product.imageUrl.filter(img => img !== product.mainImage)
    : [];
  
  const allImages = [];
  if (product.mainImage) {
    allImages.push(product.mainImage);
  }
  allImages.push(...additionalImages);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(price) + ' ⃀';
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'Активный' };
      case 'INACTIVE':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'Неактивный' };
      case 'DELETED':
        return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'Удален' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'Неизвестно' };
    }
  };

  const statusInfo = getStatusInfo(product.status);

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-[9999] lg:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="relative h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700/50 rounded-lg overflow-hidden flex-shrink-0">
                  {product.mainImage ? (
                    <img 
                      src={product.mainImage} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-white truncate">{product.name}</h2>
                  <p className="text-sm text-indigo-400 font-medium">
                    {formatPrice(product.price || product.minPrice)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded font-medium ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
                  {statusInfo.text}
                </span>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-gray-900 scrollbar-thin">
            {/* Image Gallery */}
            <div className="p-4">
              <MobileImageGallery
                images={allImages}
                productName={product.name}
                className="bg-gray-800/50 rounded-xl p-4"
              />
            </div>

            {/* Product Details */}
            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-2xl font-bold text-indigo-400">
                      {formatPrice(product.price || product.minPrice)}
                    </p>
                  </div>
                </div>
                
                {product.description && (
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {product.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 block mb-1">Категория</span>
                    <div className="flex items-center space-x-2">
                      <TagIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-white font-medium">{product.category.name}</span>
                    </div>
                  </div>
                  
                  {product.seller && (
                    <div>
                      <span className="text-gray-400 block mb-1">Продавец</span>
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-white font-medium truncate">
                          {product.seller.fullname}
                          {sellers.find(s => s.id === product.seller?.id)?.role === 'ADMIN' && (
                            <span className="ml-1 text-xs text-indigo-400">(Админ)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes and Colors */}
              {((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Характеристики
                  </h4>
                  
                  <div className="space-y-4">
                    {product.sizes && product.sizes.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-400 block mb-2">Размеры</span>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium"
                            >
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {product.colors && product.colors.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-400 block mb-2">Цвета</span>
                        <div className="flex flex-wrap gap-2">
                          {product.colors.map((color, index) => (
                            <div 
                              key={index}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 rounded-lg"
                            >
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-400/50"
                                style={{ backgroundColor: color.colorCode }}
                              />
                              <span className="text-gray-300 text-sm font-medium">{color.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attributes */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Дополнительные атрибуты</h4>
                  <div className="space-y-2">
                    {Object.entries(product.attributes).map(([key, value], index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-b-0">
                        <span className="text-gray-400 text-sm capitalize">{key}</span>
                        <span className="text-white text-sm font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Информация
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 block mb-1">Создан</span>
                    <span className="text-white">
                      {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Обновлен</span>
                    <span className="text-white">
                      {new Date(product.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed Bottom */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 p-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => onEdit(product), 100);
                  }}
                  disabled={product.status === 'DELETED'}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    product.status === 'DELETED'
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                  }`}
                >
                  <PencilIcon className="h-5 w-5" />
                  <span>Редактировать</span>
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => onDelete(product), 100);
                  }}
                  disabled={product.status === 'DELETED'}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    product.status === 'DELETED'
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
