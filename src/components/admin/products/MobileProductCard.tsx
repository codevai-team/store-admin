'use client';

import React from 'react';
import {
  PhotoIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarDaysIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

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

interface MobileProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  sellers: {id: string, fullname: string, role: string}[];
}

export default function MobileProductCard({
  product,
  onView,
  sellers
}: MobileProductCardProps) {
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
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
    <div 
      className="bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group relative z-10"
      onClick={() => onView(product)}
    >
      <div className="p-4">
        {/* Top Row: Image, Title, Price, Status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Product Image */}
          <div className="flex-shrink-0 w-16 h-16 bg-gray-700/50 rounded-lg overflow-hidden">
            {product.mainImage ? (
              <img 
                src={product.mainImage} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PhotoIcon className="h-6 w-6 text-gray-500" />
              </div>
            )}
          </div>
          
          {/* Title and Price */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm font-medium text-indigo-400">
                <CurrencyDollarIcon className="h-4 w-4" />
                <span>{formatPrice(product.price || product.minPrice)}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Category */}
          <span className="text-xs text-gray-300 bg-gray-700/60 px-2 py-1 rounded-md flex items-center space-x-1">
            <TagIcon className="h-3 w-3" />
            <span>{product.category.name}</span>
          </span>
        </div>
        
        {/* Seller and Date */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          {product.seller && (
            <div className="flex items-center space-x-1">
              <UserIcon className="h-3 w-3" />
              <span className="truncate">
                {product.seller.fullname}
                {sellers.find(s => s.id === product.seller?.id)?.role === 'ADMIN' && (
                  <span className="ml-1 text-indigo-400">(Админ)</span>
                )}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <CalendarDaysIcon className="h-3 w-3" />
            <span>{new Date(product.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        
        {/* Sizes and Colors - Compact */}
        {((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) && (
          <div className="mb-3 pt-3 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-2">
              {product.sizes && product.sizes.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400">Размеры:</span>
                  <div className="flex gap-1">
                    {product.sizes.slice(0, 3).map((size, index) => (
                      <span 
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs"
                      >
                        {size}
                      </span>
                    ))}
                    {product.sizes.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                        +{product.sizes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400">Цвета:</span>
                  <div className="flex gap-1">
                    {product.colors.slice(0, 4).map((color, index) => (
                      <div 
                        key={index}
                        className="w-3 h-3 rounded-full border border-gray-600 flex-shrink-0"
                        style={{ backgroundColor: color.colorCode }}
                        title={color.name}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{product.colors.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
