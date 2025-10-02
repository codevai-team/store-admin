'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  BarsArrowUpIcon,
  CheckIcon,
  CalendarDaysIcon,
  ArchiveBoxIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TagIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import SimpleAddProductModal, { SimpleAddProductModalRef } from '@/components/admin/products/SimpleAddProductModal';
import MobileProductViewModal from '@/components/admin/products/MobileProductViewModal';
import MobileProductCard from '@/components/admin/products/MobileProductCard';
import CustomSelect from '@/components/admin/products/CustomSelect';
import { ToastContainer } from '@/components/admin/products/Toast';
import { useToast } from '@/hooks/useToast';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
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
  imageUrl: string[];
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  sizes?: string[];
  colors?: Array<{name: string; colorCode: string}>;
  // Для совместимости с текущим кодом (заглушки)
  isActive: boolean;
  variantsCount: number;
  totalQuantity: number;
  minPrice: number;
  maxPrice: number;
  variants: number;
  images: number;
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

type SortOption = 'newest' | 'name' | 'price' | 'quantity' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';

function ProductsPageContent() {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  
  // Ref для модального окна редактирования
  const editModalRef = useRef<SimpleAddProductModalRef>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<{name: string, colorCode: string}[]>([]);
  const [sellers, setSellers] = useState<{id: string, fullname: string, role: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('');
  const [sellerFilter, setSellerFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 50;
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Mobile modal states
  const [isMobileViewModalOpen, setIsMobileViewModalOpen] = useState(false);
  const [mobileViewingProduct, setMobileViewingProduct] = useState<Product | null>(null);

  // Mobile filters state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Form state
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
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка товаров
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchColorsData = async () => {
    try {
      const response = await fetch('/api/admin/colors');
      if (response.ok) {
        const colorsData = await response.json();
        setColorOptions(colorsData);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const fetchSizesData = async () => {
    try {
      const response = await fetch('/api/admin/sizes');
      if (response.ok) {
        const sizesData = await response.json();
        // Устанавливаем доступные размеры из API
        setAvailableSizes(sizesData.map((size: { name: string }) => size.name).sort());
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
    }
  };

  const fetchSellersData = async () => {
    try {
      const response = await fetch('/api/admin/sellers');
      if (response.ok) {
        const sellersData = await response.json();
        // Фильтруем только админов и продавцов
        const filteredSellers = sellersData.filter((seller: { role: string }) => 
          seller.role === 'ADMIN' || seller.role === 'SELLER'
        );
        setSellers(filteredSellers);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchColorsData();
    fetchSizesData();
    fetchSellersData();
  }, []);

  // Auto-close mobile filters when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Умный поиск
  const smartSearch = (text: string, searchQuery: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    const textWords = text.toLowerCase().split(/\s+/);
    const searchWords = searchQuery.toLowerCase().split(/\s+/);
    
    return searchWords.every(searchWord => 
      textWords.some(textWord => textWord.includes(searchWord))
    );
  };

  // Получить все ID подкатегорий для выбранной категории (рекурсивно)
  const getAllSubcategoryIds = (categoryId: string, categoriesList: Category[]): string[] => {
    const subcategoryIds: string[] = [categoryId]; // Включаем саму категорию
    
    const findChildren = (parentId: string) => {
      const children = categoriesList.filter(cat => cat.parentId === parentId);
      children.forEach(child => {
        subcategoryIds.push(child.id);
        findChildren(child.id); // Рекурсивно ищем подкатегории
      });
    };
    
    findChildren(categoryId);
    return subcategoryIds;
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = smartSearch(product.name + ' ' + product.description, searchTerm);
    
    // Фильтрация по категории с учетом подкатегорий
    let matchesCategory = true;
    if (categoryFilter) {
      const allowedCategoryIds = getAllSubcategoryIds(categoryFilter, categories);
      matchesCategory = allowedCategoryIds.includes(product.categoryId);
    }
    
    // Фильтрация по цвету
    let matchesColor = true;
    if (colorFilter) {
      matchesColor = product.colors?.some(color => 
        typeof color === 'object' && color.name === colorFilter
      ) || false;
    }
    
    // Фильтрация по размеру
    let matchesSize = true;
    if (sizeFilter) {
      matchesSize = product.sizes?.includes(sizeFilter) || false;
    }
    
    // Фильтрация по продавцу
    let matchesSeller = true;
    if (sellerFilter) {
      matchesSeller = product.seller?.id === sellerFilter;
    }
    
    // Фильтрация по статусу
    let matchesStatus = true;
    if (statusFilter) {
      matchesStatus = product.status === statusFilter;
    }
    
    return matchesSearch && matchesCategory && matchesColor && matchesSize && matchesSeller && matchesStatus;
  });

  // Сортировка товаров
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'newest':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ru');
        break;
      case 'price':
        comparison = (a.price || a.minPrice) - (b.price || b.minPrice);
        break;
      case 'quantity':
        comparison = (b.totalQuantity || 1) - (a.totalQuantity || 1);
        break;
      case 'category':
        comparison = a.category.name.localeCompare(b.category.name, 'ru');
        break;
      case 'status':
        // Порядок сортировки: ACTIVE -> INACTIVE -> DELETED
        const statusOrder = { 'ACTIVE': 0, 'INACTIVE': 1, 'DELETED': 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  // Пагинация
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, colorFilter, sizeFilter, sellerFilter, statusFilter, sortBy, sortOrder]);

  // Обработка URL параметров для автоматического открытия продукта
  useEffect(() => {
    const viewProductId = searchParams.get('view');
    if (viewProductId && products.length > 0) {
      const productToView = products.find(p => p.id === viewProductId);
      if (productToView) {
        openViewModal(productToView);
        // Очищаем URL параметр после открытия модального окна
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, products]);

  // Клавиатурные сокращения
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Обработчики модальных окон
  const openCreateModal = () => {
    setFormData({ 
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
    setIsCreateModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    // Заполняем форму данными товара
    setFormData({
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      price: product.price,
      sellerId: product.seller?.id || '',
      status: product.status,
      imageUrl: Array.isArray(product.imageUrl) ? product.imageUrl : [],
      attributes: product.attributes || {},
      sizes: product.sizes || [],
      colors: product.colors?.map(color => color.name) || []
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (product: Product) => {
    setViewingProduct(product);
    setCurrentImageIndex(0);
    setIsViewModalOpen(true);
  };

  const openMobileViewModal = (product: Product) => {
    setMobileViewingProduct(product);
    setIsMobileViewModalOpen(true);
  };

  const closeModals = () => {
    // Сбрасываем состояние изображений в модальном окне редактирования
    if (editModalRef.current) {
      editModalRef.current.resetImageState();
    }
    
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
    setIsMobileViewModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
    setViewingProduct(null);
    setMobileViewingProduct(null);
    setFormData({ 
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
  };

  // Создание товара с вариантами
  const handleCreateProduct = async (data: ProductFormData): Promise<boolean> => {
    setFormLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchProducts();
        closeModals();
        // Показываем уведомление после закрытия модального окна
        setTimeout(() => {
          showSuccess('Товар создан', 'Товар успешно добавлен в каталог');
        }, 100);
        return true;
      } else {
        const error = await response.json();
        showError('Ошибка создания', error.error || 'Ошибка создания товара');
        return false;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showError('Ошибка создания', 'Ошибка создания товара');
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  // Обновление товара
  const handleUpdateProduct = async (data: ProductFormData): Promise<boolean> => {
    if (!editingProduct) return false;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchProducts();
        closeModals();
        // Показываем уведомление после закрытия модального окна
        setTimeout(() => {
          showSuccess('Товар обновлен', 'Изменения успешно сохранены');
        }, 100);
        return true;
      } else {
        const error = await response.json();
        showError('Ошибка обновления', error.error || 'Ошибка обновления товара');
        return false;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Ошибка обновления', 'Ошибка обновления товара');
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление товара (изменение статуса на DELETED)
  const handleDelete = async () => {
    if (!deletingProduct) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: deletingProduct.name,
          description: deletingProduct.description,
          categoryId: deletingProduct.categoryId,
          price: deletingProduct.price,
          sellerId: deletingProduct.seller?.id,
          status: 'DELETED',
          imageUrl: deletingProduct.imageUrl,
          attributes: deletingProduct.attributes,
          sizes: deletingProduct.sizes || [],
          colors: deletingProduct.colors?.map(color => color.name) || []
        })
      });

      if (response.ok) {
        await fetchProducts();
        closeModals();
        showSuccess('Товар удален', 'Товар был помечен как удаленный');
      } else {
        const error = await response.json();
        showError('Ошибка удаления', error.error || 'Ошибка удаления товара');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Ошибка удаления', 'Ошибка удаления товара');
    } finally {
      setFormLoading(false);
    }
  };

  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
    }).format(price) + ' с.';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Товары</h1>
              <p className="text-gray-300">Управление каталогом товаров</p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 relative overflow-visible z-10">
          <div className="space-y-4">
            {/* Search and Sort Row */}
            <div className="flex flex-row gap-3">
              {/* Search - Left side */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-12 h-10 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 text-sm sm:text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right side controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Mobile Filter Toggle Button - Only visible on mobile/tablet */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className="flex items-center justify-center px-3 py-2 h-10 rounded-lg border border-gray-600/50 bg-gray-700/30 text-gray-400 hover:border-gray-500/50 hover:text-gray-300 transition-all duration-200"
                    title="Фильтры и сортировка"
                  >
                    <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                {/* Desktop Sort Controls - Hidden on mobile/tablet */}
                <div className="hidden lg:flex items-center space-x-2">
                <div className="min-w-[200px]">
                  <CustomSelect
                    value={sortBy}
                    onChange={(value) => setSortBy(value as SortOption)}
                    options={[
                      { value: 'newest', label: 'По новизне' },
                      { value: 'name', label: 'По названию' },
                      { value: 'price', label: 'По цене' },
                      { value: 'quantity', label: 'По количеству' },
                      { value: 'category', label: 'По категории' },
                      { value: 'status', label: 'По статусу' }
                    ]}
                    icon={<BarsArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                    className="text-sm"
                  />
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`flex items-center justify-center px-3 py-2 h-10 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                    sortOrder === 'desc'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                  }`}
                  title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                >
                  {sortOrder === 'desc' ? (
                    <ArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
                </div>
              </div>
            </div>

            {/* Desktop Filters Row - Hidden on mobile/tablet */}
            <div className="hidden lg:flex flex-col lg:flex-row gap-3">
              {/* Category Filter */}
              <div className="flex-1 max-w-full">
                <CustomSelect
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value)}
                  options={[
                    { value: '', label: 'Все категории' },
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
                      ]),
                    // Orphaned категории
                    ...categories
                      .filter(category => category.parentId && !categories.find(c => c.id === category.parentId))
                      .map(category => ({
                        value: category.id,
                        label: `⚠ ${category.name}`
                      }))
                  ]}
                  placeholder="Все категории"
                  icon={<TagIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-sm"
                />
              </div>

              {/* Color Filter */}
              <div className="flex-1 max-w-full">
                <CustomSelect
                  value={colorFilter}
                  onChange={(value) => setColorFilter(value)}
                  options={[
                    { value: '', label: 'Все цвета' },
                    ...colorOptions.map((colorOption) => ({
                      value: colorOption.name,
                      label: colorOption.name,
                      icon: (
                        <div 
                          className="h-4 w-4 rounded-full border border-gray-400/50" 
                          style={{ backgroundColor: colorOption.colorCode }}
                        />
                      )
                    }))
                  ]}
                  placeholder="Все цвета"
                  icon={<PhotoIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-sm"
                />
              </div>

              {/* Size Filter */}
              <div className="flex-1 max-w-full">
                <CustomSelect
                  value={sizeFilter}
                  onChange={(value) => setSizeFilter(value)}
                  options={[
                    { value: '', label: 'Все размеры' },
                    ...availableSizes.map((size) => ({
                      value: size,
                      label: size
                    }))
                  ]}
                  placeholder="Все размеры"
                  icon={<TagIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-sm"
                />
              </div>

              {/* Seller Filter */}
              <div className="flex-1 max-w-full">
                <CustomSelect
                  value={sellerFilter}
                  onChange={(value) => setSellerFilter(value)}
                  options={[
                    { value: '', label: 'Все продавцы' },
                    ...sellers.map((seller) => ({
                      value: seller.id,
                      label: `${seller.fullname} (${seller.role === 'ADMIN' ? 'Админ' : 'Продавец'})`
                    }))
                  ]}
                  placeholder="Все продавцы"
                  icon={<UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="flex-1 max-w-full">
                <CustomSelect
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={[
                    { value: '', label: 'Все статусы' },
                    { value: 'ACTIVE', label: 'Активные' },
                    { value: 'INACTIVE', label: 'Неактивные' },
                    { value: 'DELETED', label: 'Удаленные' }
                  ]}
                  placeholder="Все статусы"
                  icon={<CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Mobile Filters - Collapsible */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-visible relative z-20 ${
              isMobileFiltersOpen ? 'max-h-[800px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
            }`}>
              <div className="space-y-4 pt-4 border-t border-gray-700/50">
                {/* Mobile Sort Controls */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Сортировка</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <CustomSelect
                        value={sortBy}
                        onChange={(value) => setSortBy(value as SortOption)}
                        options={[
                          { value: 'newest', label: 'По новизне' },
                          { value: 'name', label: 'По названию' },
                          { value: 'price', label: 'По цене' },
                          { value: 'quantity', label: 'По количеству' },
                          { value: 'category', label: 'По категории' },
                          { value: 'status', label: 'По статусу' }
                        ]}
                        icon={<BarsArrowUpIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`flex items-center justify-center px-3 py-2 h-10 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        sortOrder === 'desc'
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                      }`}
                      title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                    >
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-4 w-4" />
                      ) : (
                        <ArrowUpIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Фильтры</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Category Filter */}
                    <div>
                      <CustomSelect
                        value={categoryFilter}
                        onChange={(value) => setCategoryFilter(value)}
                        options={[
                          { value: '', label: 'Все категории' },
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
                            ]),
                          // Orphaned категории
                          ...categories
                            .filter(category => category.parentId && !categories.find(c => c.id === category.parentId))
                            .map(category => ({
                              value: category.id,
                              label: `⚠ ${category.name}`
                            }))
                        ]}
                        placeholder="Все категории"
                        icon={<TagIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>

                    {/* Color Filter */}
                    <div>
                      <CustomSelect
                        value={colorFilter}
                        onChange={(value) => setColorFilter(value)}
                        options={[
                          { value: '', label: 'Все цвета' },
                          ...colorOptions.map((colorOption) => ({
                            value: colorOption.name,
                            label: colorOption.name,
                            icon: (
                              <div 
                                className="h-4 w-4 rounded-full border border-gray-400/50" 
                                style={{ backgroundColor: colorOption.colorCode }}
                              />
                            )
                          }))
                        ]}
                        placeholder="Все цвета"
                        icon={<PhotoIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>

                    {/* Size Filter */}
                    <div>
                      <CustomSelect
                        value={sizeFilter}
                        onChange={(value) => setSizeFilter(value)}
                        options={[
                          { value: '', label: 'Все размеры' },
                          ...availableSizes.map((size) => ({
                            value: size,
                            label: size
                          }))
                        ]}
                        placeholder="Все размеры"
                        icon={<TagIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>

                    {/* Seller Filter */}
                    <div>
                      <CustomSelect
                        value={sellerFilter}
                        onChange={(value) => setSellerFilter(value)}
                        options={[
                          { value: '', label: 'Все продавцы' },
                          ...sellers.map((seller) => ({
                            value: seller.id,
                            label: `${seller.fullname} (${seller.role === 'ADMIN' ? 'Админ' : 'Продавец'})`
                          }))
                        ]}
                        placeholder="Все продавцы"
                        icon={<UserIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <CustomSelect
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        options={[
                          { value: '', label: 'Все статусы' },
                          { value: 'ACTIVE', label: 'Активные' },
                          { value: 'INACTIVE', label: 'Неактивные' },
                          { value: 'DELETED', label: 'Удаленные' }
                        ]}
                        placeholder="Все статусы"
                        icon={<CheckIcon className="h-4 w-4" />}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <ArchiveBoxIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">
                      {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                    </span>
                    <span className="hidden sm:inline">
                      Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                    </span>
                  </span>
                </div>
                
                {searchTerm && (
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      <span className="sm:hidden">&quot;{searchTerm}&quot;</span>
                      <span className="hidden sm:inline">Поиск: &quot;{searchTerm}&quot;</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-3">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <CubeIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm || categoryFilter || colorFilter || sizeFilter || sellerFilter || statusFilter ? 'Товары не найдены' : 'Нет товаров'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter || colorFilter || sizeFilter || sellerFilter || statusFilter
                  ? 'Попробуйте изменить критерии поиска' 
                  : 'Создайте первый товар для начала работы'
                }
              </p>
              {!searchTerm && !categoryFilter && !colorFilter && !sizeFilter && !sellerFilter && !statusFilter && (
                <button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
                >
                  Создать товар
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedProducts.map(product => (
                <div key={product.id}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    <MobileProductCard
                      product={product}
                      onView={openMobileViewModal}
                      sellers={sellers}
                    />
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div 
                      className="flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-700/30 rounded-lg p-4 transition-colors duration-200 border border-gray-700/50"
                      onClick={() => openViewModal(product)}
                    >
                  <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                    {/* Product Image */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-700/50 rounded-lg overflow-hidden">
                      {product.mainImage ? (
                        <Image 
                          src={product.mainImage} 
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <h3 className="font-medium text-white text-base truncate">{product.name}</h3>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                            {product.category.name}
                          </span>
                          
                          {/* Status Tag */}
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            product.status === 'ACTIVE' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : product.status === 'INACTIVE'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {product.status === 'ACTIVE' ? 'Активный' : product.status === 'INACTIVE' ? 'Неактивный' : 'Удален'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {formatPrice(product.price || product.minPrice)}
                          </span>
                        </div>

                        {product.seller && (
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <UserIcon className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {product.seller.fullname}
                              {sellers.find(s => s.id === product.seller?.id)?.role === 'ADMIN' && (
                                <span className="ml-1 text-xs text-indigo-400">(Админ)</span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-400">Размеры:</span>
                            <div className="flex flex-wrap gap-1">
                              {product.sizes.map((size, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                                >
                                  {size}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {product.colors && product.colors.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-400">Цвета:</span>
                            <div className="flex flex-wrap gap-1">
                              {product.colors.map((color, index) => (
                                <div 
                                  key={index}
                                  className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0"
                                  style={{ backgroundColor: color.colorCode }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{new Date(product.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(product)}
                      disabled={product.status === 'DELETED'}
                      className={`p-2 rounded-lg transition-colors ${
                        product.status === 'DELETED'
                          ? 'text-gray-600 cursor-not-allowed opacity-50'
                          : 'text-blue-400 hover:bg-blue-500/20'
                      }`}
                      title={product.status === 'DELETED' ? 'Удаленные товары нельзя редактировать' : 'Редактировать'}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => openDeleteModal(product)}
                      disabled={product.status === 'DELETED'}
                      className={`p-2 rounded-lg transition-colors ${
                        product.status === 'DELETED'
                          ? 'text-gray-600 cursor-not-allowed opacity-50'
                          : 'text-red-400 hover:bg-red-500/20'
                      }`}
                      title={product.status === 'DELETED' ? 'Товар уже удален' : 'Удалить'}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Pagination with Sort Indicator */}
        {totalPages > 1 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-xs sm:text-sm text-gray-400">
                  <span className="sm:hidden">
                    {currentPage}/{totalPages}
                  </span>
                  <span className="hidden sm:inline">
                    Страница {currentPage} из {totalPages}
                  </span>
                </div>
                
                {/* Sort indicator in same row */}
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                  {sortBy === 'newest' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                      <span className="text-blue-400 font-medium hidden sm:inline">По новизне</span>
                      <span className="text-blue-400 font-medium sm:hidden">Новизне</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-blue-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'name' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <BarsArrowUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                      <span className="text-green-400 font-medium hidden sm:inline">По названию</span>
                      <span className="text-green-400 font-medium sm:hidden">Названию</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'price' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <CurrencyDollarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-medium hidden sm:inline">По цене</span>
                      <span className="text-yellow-400 font-medium sm:hidden">Цене</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'quantity' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <ArchiveBoxIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                      <span className="text-purple-400 font-medium hidden sm:inline">По количеству</span>
                      <span className="text-purple-400 font-medium sm:hidden">Количеству</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'category' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <TagIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 flex-shrink-0" />
                      <span className="text-orange-400 font-medium hidden sm:inline">По категории</span>
                      <span className="text-orange-400 font-medium sm:hidden">Категории</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-orange-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-orange-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'status' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-pink-400 flex-shrink-0" />
                      <span className="text-pink-400 font-medium hidden sm:inline">По статусу</span>
                      <span className="text-pink-400 font-medium sm:hidden">Статус</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-pink-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-pink-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {/* First Page - Hide on mobile */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Первая страница"
                >
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Предыдущая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {/* Mobile: 3 buttons, Desktop: 5 buttons */}
                  <div className="flex sm:hidden items-center space-x-1">
                    {[...Array(Math.min(3, totalPages))].map((_, index) => {
                      let pageNumber;
                      
                      if (totalPages <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 2) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNumber = totalPages - 2 + index;
                      } else {
                        pageNumber = currentPage - 1 + index;
                      }

                      const isActive = pageNumber === currentPage;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 min-w-[32px] ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Desktop: 5 buttons */}
                  <div className="hidden sm:flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      let pageNumber;
                      
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      const isActive = pageNumber === currentPage;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 min-w-[36px] ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Следующая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </button>

                {/* Last Page - Hide on mobile */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Последняя страница"
                >
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-400">
                <span className="sm:hidden">
                  {totalItems} всего
                </span>
                <span className="hidden sm:inline">
                  {totalItems} товаров всего
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        <SimpleAddProductModal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          onSubmit={handleCreateProduct}
          categories={categories}
          loading={formLoading}
          onShowError={(title, message) => showError(title, message)}
        />

        {/* Edit Product Modal */}
        {isEditModalOpen && editingProduct && (
          <SimpleAddProductModal
            ref={editModalRef}
            isOpen={isEditModalOpen}
            onClose={closeModals}
            onSubmit={handleUpdateProduct}
            categories={categories}
            loading={formLoading}
            onShowError={(title, message) => showError(title, message)}
            initialData={formData}
            isEdit={true}
          />
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && deletingProduct && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-lg border border-gray-700/50 shadow-2xl mx-4">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Удалить товар</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Warning Section */}
                <div className="flex items-start space-x-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <TrashIcon className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">
                      Подтверждение удаления
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Вы уверены, что хотите удалить товар <strong className="text-white font-medium">&quot;{deletingProduct.name}&quot;</strong>?
                    </p>
                  </div>
                </div>
                
                {/* Info Section */}
                <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-yellow-400 text-xs">⚠</span>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        <strong className="text-yellow-300">Внимание:</strong> Товар будет помечен как удаленный и не может быть восстановлен. Это действие необратимо.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Информация о товаре:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Название:</span>
                      <span className="text-white font-medium">{deletingProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Категория:</span>
                      <span className="text-white">{deletingProduct.category.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Цена:</span>
                      <span className="text-white">{formatPrice(deletingProduct.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Текущий статус:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        deletingProduct.status === 'ACTIVE' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : deletingProduct.status === 'INACTIVE'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {deletingProduct.status === 'ACTIVE' ? 'Активный' : deletingProduct.status === 'INACTIVE' ? 'Неактивный' : 'Удален'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700/50 p-4 sm:p-6">
                <div className="flex space-x-3">
                  <button
                    onClick={closeModals}
                    className="flex-1 px-4 py-3 border border-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={formLoading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-red-500/25"
                  >
                    {formLoading ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Product Modal */}
        {isViewModalOpen && viewingProduct && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-5xl border border-gray-700/50 shadow-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{viewingProduct.name}</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-thin">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Images Section */}
                  <div className="space-y-4 flex flex-col">
                    {/* Main Image Display */}
                    <div className="bg-gray-700/30 rounded-xl p-4">
                      <div className="aspect-square bg-gray-600/30 rounded-lg overflow-hidden relative">
                        {(() => {
                          // Создаем массив дополнительных изображений, исключая mainImage
                          const additionalImages = Array.isArray(viewingProduct.imageUrl) 
                            ? viewingProduct.imageUrl.filter(img => img !== viewingProduct.mainImage)
                            : [];
                          
                          // Формируем полный массив: mainImage + дополнительные (без дублирования)
                          const allImages = [];
                          if (viewingProduct.mainImage) {
                            allImages.push(viewingProduct.mainImage);
                          }
                          allImages.push(...additionalImages);
                          
                          const currentImage = allImages[currentImageIndex];
                          
                          return currentImage ? (
                            <Image 
                              src={currentImage} 
                              alt={viewingProduct.name}
                              width={600}
                              height={400}
                              className="w-full h-full object-contain bg-gray-800"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PhotoIcon className="h-16 w-16 text-gray-500" />
                            </div>
                          );
                        })()}
                        
                        {/* Navigation arrows */}
                        {(() => {
                          // Создаем массив дополнительных изображений, исключая mainImage
                          const additionalImages = Array.isArray(viewingProduct.imageUrl) 
                            ? viewingProduct.imageUrl.filter(img => img !== viewingProduct.mainImage)
                            : [];
                          
                          // Формируем полный массив: mainImage + дополнительные (без дублирования)
                          const allImages = [];
                          if (viewingProduct.mainImage) {
                            allImages.push(viewingProduct.mainImage);
                          }
                          allImages.push(...additionalImages);
                          
                          if (allImages.length > 1) {
                            return (
                              <>
                                <button
                                  onClick={() => setCurrentImageIndex(prev => 
                                    prev === 0 ? allImages.length - 1 : prev - 1
                                  )}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                                >
                                  <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setCurrentImageIndex(prev => 
                                    prev === allImages.length - 1 ? 0 : prev + 1
                                  )}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                                >
                                  <ChevronLeftIcon className="h-4 w-4 rotate-180" />
                                </button>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {/* Image counter */}
                      {(() => {
                        // Создаем массив дополнительных изображений, исключая mainImage
                        const additionalImages = Array.isArray(viewingProduct.imageUrl) 
                          ? viewingProduct.imageUrl.filter(img => img !== viewingProduct.mainImage)
                          : [];
                        
                        // Формируем полный массив: mainImage + дополнительные (без дублирования)
                        const allImages = [];
                        if (viewingProduct.mainImage) {
                          allImages.push(viewingProduct.mainImage);
                        }
                        allImages.push(...additionalImages);
                        
                        if (allImages.length > 1) {
                          return (
                            <div className="mt-2 text-center text-sm text-gray-400">
                              {currentImageIndex + 1} из {allImages.length}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Thumbnail Navigation */}
                    {(() => {
                      // Создаем массив дополнительных изображений, исключая mainImage
                      const additionalImages = Array.isArray(viewingProduct.imageUrl) 
                        ? viewingProduct.imageUrl.filter(img => img !== viewingProduct.mainImage)
                        : [];
                      
                      // Формируем полный массив: mainImage + дополнительные (без дублирования)
                      const allImages = [];
                      if (viewingProduct.mainImage) {
                        allImages.push(viewingProduct.mainImage);
                      }
                      allImages.push(...additionalImages);
                      
                      if (allImages.length > 1) {
                        return (
                          <div className="bg-gray-700/30 rounded-xl p-4">
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {allImages.map((image, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`aspect-square bg-gray-600/30 rounded-lg overflow-hidden transition-all duration-200 ${
                                    index === currentImageIndex 
                                      ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-800' 
                                      : 'hover:bg-gray-600/50'
                                  }`}
                                >
                                  <Image 
                                    src={image} 
                                    alt={`${viewingProduct.name} - изображение ${index + 1}`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-contain bg-gray-800"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Product Details - Compact */}
                  <div className="grid grid-rows-3 gap-4 h-full">
                    {/* Basic Info - Compact */}
                    <div className="bg-gray-700/30 rounded-xl p-4 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{viewingProduct.name}</h3>
                          <p className="text-2xl font-bold text-indigo-400 mt-1">
                            {formatPrice(viewingProduct.price || viewingProduct.minPrice)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          viewingProduct.status === 'ACTIVE' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : viewingProduct.status === 'INACTIVE'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {viewingProduct.status === 'ACTIVE' ? 'Активный' : viewingProduct.status === 'INACTIVE' ? 'Неактивный' : 'Удален'}
                        </span>
                      </div>
                      
                      {viewingProduct.description && (
                        <p className="text-gray-300 text-sm leading-relaxed mb-3 flex-grow">
                          {viewingProduct.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm mt-auto">
                        <div>
                          <span className="text-gray-400">Категория:</span>
                          <p className="text-white font-medium">{viewingProduct.category.name}</p>
                        </div>
                        {viewingProduct.seller && (
                          <div>
                            <span className="text-gray-400">Продавец:</span>
                            <p className="text-white font-medium">
                              {viewingProduct.seller.fullname}
                              {sellers.find(s => s.id === viewingProduct.seller?.id)?.role === 'ADMIN' && (
                                <span className="ml-1 text-xs text-indigo-400">(Админ)</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sizes, Colors and Attributes - Compact */}
                    {((viewingProduct.sizes && viewingProduct.sizes.length > 0) || (viewingProduct.colors && viewingProduct.colors.length > 0) || (viewingProduct.attributes && Object.keys(viewingProduct.attributes).length > 0)) ? (
                      <div className="bg-gray-700/30 rounded-xl p-4 flex flex-col">
                        <h4 className="text-sm font-semibold text-white mb-3">Характеристики</h4>
                        <div className="space-y-3 flex-grow">
                          {viewingProduct.sizes && viewingProduct.sizes.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Размеры:</span>
                              <div className="flex flex-wrap gap-1">
                                {viewingProduct.sizes.map((size, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs"
                                  >
                                    {size}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {viewingProduct.colors && viewingProduct.colors.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Цвета:</span>
                              <div className="flex flex-wrap gap-1">
                                {viewingProduct.colors.map((color, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center space-x-1 px-2 py-1 bg-gray-600 rounded text-xs"
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full border border-gray-400/50"
                                      style={{ backgroundColor: color.colorCode }}
                                    />
                                    <span className="text-gray-300">{color.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {viewingProduct.attributes && Object.keys(viewingProduct.attributes).length > 0 && (
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Атрибуты:</span>
                              <div className="space-y-1">
                                {Object.entries(viewingProduct.attributes).map(([key, value], index) => (
                                  <div key={index} className="flex justify-between text-xs">
                                    <span className="text-gray-400 capitalize">{key}:</span>
                                    <span className="text-gray-300">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-700/30 rounded-xl p-4 flex flex-col">
                        <h4 className="text-sm font-semibold text-white mb-3">Характеристики</h4>
                        <div className="flex-grow flex items-center justify-center">
                          <p className="text-gray-500 text-sm">Характеристики не указаны</p>
                        </div>
                      </div>
                    )}

                    {/* Dates - Compact */}
                    <div className="bg-gray-700/30 rounded-xl p-4 flex flex-col">
                      <h4 className="text-sm font-semibold text-white mb-2">Информация</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400">Создан:</span>
                          <p className="text-white">{new Date(viewingProduct.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Обновлен:</span>
                          <p className="text-white">{new Date(viewingProduct.updatedAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Product View Modal */}
        <MobileProductViewModal
          isOpen={isMobileViewModalOpen}
          onClose={closeModals}
          product={mobileViewingProduct}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          sellers={sellers}
        />
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </AdminLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
