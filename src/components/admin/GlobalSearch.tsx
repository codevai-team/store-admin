'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ShieldCheckIcon,
  TruckIcon,
  TagIcon,
  Cog6ToothIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

// Функция для получения иконки по названию
function getIconComponent(iconName: string) {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'ClipboardDocumentListIcon': ClipboardDocumentListIcon,
    'UserIcon': UserIcon,
    'ShieldCheckIcon': ShieldCheckIcon,
    'TruckIcon': TruckIcon,
    'TagIcon': TagIcon,
    'Cog6ToothIcon': Cog6ToothIcon,
    'CubeIcon': CubeIcon,
  };
  
  return iconMap[iconName] || UserIcon;
}

// Компонент для отображения изображения с fallback на иконку
function ItemImage({ src, alt, fallbackIcon }: { 
  src: string; 
  alt: string; 
  fallbackIcon: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    const IconComponent = getIconComponent(fallbackIcon);
    return (
      <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-700/50 mt-0.5 flex items-center justify-center">
        <IconComponent className="h-5 w-5 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700/50 mt-0.5">
      <Image
        src={src}
        alt={alt}
        width={40}
        height={40}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        unoptimized // Для внешних изображений
      />
    </div>
  );
}

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'user' | 'category' | 'setting';
  title: string;
  subtitle: string;
  description: string;
  url: string;
  icon: string;
  price?: string;
  status?: string;
  role?: string;
  image?: string; // Добавляем поле для изображения
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
}

export default function GlobalSearch({ 
  placeholder = "Поиск товаров, заказов, клиентов...", 
  className = "",
  isMobile = false,
  onFocusChange
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}&limit=8`);
        if (response.ok) {
          const data: SearchResponse = await response.json();
          setResults(data.results);
          setIsOpen(data.results.length > 0);
        }
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Навигация клавиатурой
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        onFocusChange?.(false);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    
    // Сбрасываем фокус для мобильных устройств
    onFocusChange?.(false);
    
    // Для разных типов результатов используем разные стратегии навигации
    switch (result.type) {
      case 'product':
        // Переходим на страницу продуктов с параметром для открытия конкретного продукта
        router.push(`/admin/products?view=${result.id}`);
        break;
      case 'order':
        // Переходим на страницу заказов с параметром для открытия конкретного заказа
        router.push(`/admin/orders?view=${result.id}`);
        break;
      case 'user':
        // Переходим на страницу сотрудников с параметром для открытия конкретного сотрудника
        router.push(`/admin/staff?view=${result.id}`);
        break;
      case 'category':
        // Переходим на страницу категорий с параметром для открытия конкретной категории
        router.push(`/admin/categories?view=${result.id}`);
        break;
      case 'setting':
        // Переходим на страницу настроек
        router.push('/admin/settings');
        break;
      default:
        // Fallback - используем оригинальный URL
        router.push(result.url);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'text-blue-400';
      case 'COURIER_WAIT': return 'text-yellow-400';
      case 'COURIER_PICKED': return 'text-orange-400';
      case 'ENROUTE': return 'text-purple-400';
      case 'DELIVERED': return 'text-green-400';
      case 'CANCELED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CREATED': return 'Создан';
      case 'COURIER_WAIT': return 'Ожидает курьера';
      case 'COURIER_PICKED': return 'Забран курьером';
      case 'ENROUTE': return 'В пути';
      case 'DELIVERED': return 'Доставлен';
      case 'CANCELED': return 'Отменен';
      default: return status;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Поле поиска */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 lg:pl-4 flex items-center pointer-events-none z-10">
          <MagnifyingGlassIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400 group-focus-within:text-indigo-400 transition-colors duration-200`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            // Задержка для обработки кликов по результатам
            setTimeout(() => {
              onFocusChange?.(false);
            }, 200);
          }}
          placeholder={placeholder}
          className={`
            block w-full ${isMobile ? 'pl-10 pr-8 py-2 text-sm' : 'pl-12 pr-10 py-2.5 text-sm'} 
            border border-gray-600/50 ${isMobile ? 'rounded-lg' : 'rounded-xl'} leading-5 
            bg-gray-800/50 text-gray-200 placeholder-gray-400 
            focus:outline-none focus:bg-gray-700/70 focus:border-indigo-500/50 
            focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 backdrop-blur-sm
          `}
        />
        
        {/* Кнопка очистки */}
        {query && (
          <button
            onClick={clearSearch}
            className={`absolute inset-y-0 right-0 ${isMobile ? 'pr-3' : 'pr-4'} flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-200`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        
        {/* Градиентный эффект */}
        <div className={`absolute inset-0 ${isMobile ? 'rounded-lg' : 'rounded-xl'} bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none`}></div>
      </div>

      {/* Результаты поиска */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-2xl z-50 max-h-96 overflow-y-auto scrollbar-thin`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto"></div>
              <p className="mt-2 text-sm">Поиск...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`
                    w-full text-left px-4 py-3 hover:bg-gray-700/60 transition-all duration-200 border-l-2
                    ${selectedIndex === index 
                      ? 'bg-gray-700/60 border-indigo-400' 
                      : 'border-transparent hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {/* Для товаров и категорий показываем изображение, для остальных - иконку */}
                    {(result.type === 'product' || result.type === 'category') && result.image ? (
          <ItemImage 
            src={result.image}
            alt={result.title}
            fallbackIcon={result.icon}
          />
                    ) : (
                      (() => {
                        const IconComponent = getIconComponent(result.icon);
                        return (
                          <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-700/50 mt-0.5 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-gray-300" />
                          </div>
                        );
                      })()
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white truncate">
                          {result.title}
                        </h4>
                        {result.price && (
                          <span className="text-sm font-semibold text-green-400 ml-2">
                            {result.price} ⃀
                          </span>
                        )}
                        {result.status && (
                          <span className={`text-xs font-medium ml-2 ${getStatusColor(result.status)}`}>
                            {getStatusLabel(result.status)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-300 mt-0.5">
                        {result.subtitle}
                      </p>
                      {result.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Подсказка по навигации */}
              <div className="px-4 py-2 border-t border-gray-600/30 bg-gray-700/30">
                <p className="text-xs text-gray-400 text-center">
                  ↑↓ для навигации • Enter для выбора • Esc для закрытия
                </p>
              </div>
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-400">
              <p className="text-sm">Ничего не найдено</p>
              <p className="text-xs mt-1">Попробуйте изменить запрос</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
