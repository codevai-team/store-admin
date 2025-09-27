'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TagIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  FireIcon,
  BarsArrowUpIcon,
  CubeIcon,
  CheckIcon,
  CalendarDaysIcon,
  ArchiveBoxIcon,
  BarsArrowDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  // Иконки для категорий
  ShoppingBagIcon,
  HomeIcon,
  UserIcon,
  HeartIcon,
  StarIcon,
  GiftIcon,
  SparklesIcon,
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CameraIcon,
  TruckIcon as CarIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  FaceSmileIcon,
  CommandLineIcon,
  GlobeAltIcon,
  HandThumbUpIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  SunIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  // Дополнительные иконки
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowUturnUpIcon,
  ArrowUturnDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ArrowPathRoundedSquareIcon,
  ArrowSmallUpIcon,
  ArrowSmallDownIcon,
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
  AtSymbolIcon,
  BackspaceIcon,
  BanknotesIcon,
  Bars3Icon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars4Icon,
  BellIcon,
  BellSlashIcon,
  BoltIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  CakeIcon,
  CalculatorIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
  ChatBubbleLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleOvalLeftIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClipboardIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CloudIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  CogIcon,
  Cog6ToothIcon,
  Cog8ToothIcon,
  CpuChipIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  CurrencyDollarIcon,
  CurrencyEuroIcon,
  CurrencyPoundIcon,
  CurrencyRupeeIcon,
  CurrencyYenIcon,
  CursorArrowRaysIcon,
  CursorArrowRippleIcon,
  DeviceTabletIcon,
  DocumentIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  DocumentMagnifyingGlassIcon,
  DocumentMinusIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  FaceFrownIcon,
  FilmIcon,
  FingerPrintIcon,
  FlagIcon,
  FolderIcon,
  FolderArrowDownIcon,
  FolderMinusIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  GifIcon,
  GlobeAmericasIcon,
  GlobeAsiaAustraliaIcon,
  GlobeEuropeAfricaIcon,
  HandRaisedIcon,
  HandThumbDownIcon,
  HashtagIcon,
  IdentificationIcon,
  InboxIcon,
  InformationCircleIcon,
  KeyIcon,
  LanguageIcon,
  LifebuoyIcon,
  LinkIcon,
  ListBulletIcon,
  LockClosedIcon,
  LockOpenIcon,
  MapIcon,
  MapPinIcon,
  MegaphoneIcon,
  MicrophoneIcon,
  MinusIcon,
  MoonIcon,
  NewspaperIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PauseIcon,
  PencilSquareIcon,
  PhoneIcon,
  PhotoIcon,
  PlayIcon,
  PlayPauseIcon,
  PlusCircleIcon,
  PowerIcon,
  PresentationChartBarIcon,
  PresentationChartLineIcon,
  PrinterIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon,
  RadioIcon,
  ReceiptPercentIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  RssIcon,
  ScaleIcon,
  ServerIcon,
  ServerStackIcon,
  ShareIcon,
  ShieldExclamationIcon,
  SignalIcon,
  SignalSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Square2StackIcon,
  Square3Stack3DIcon,
  StopIcon,
  StopCircleIcon,
  SwatchIcon,
  TicketIcon,
  TrophyIcon,
  TvIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ViewfinderCircleIcon,
  WalletIcon,
  WifiIcon,
  WindowIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import IconUpload from '@/components/admin/categories/IconUpload';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children: Category[];
  productsCount: number;
  childrenCount: number;
}

interface CategoryFormData {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId: string | null;
}

type SortOption = 'popular' | 'alphabetical' | 'products';
type SortOrder = 'asc' | 'desc';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Функция для отображения иконки категории
const renderCategoryIcon = (imageUrl: string | null) => {
  if (!imageUrl) {
    return <TagIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400 flex-shrink-0" />;
  }
  
  // Если это URL изображения, показываем изображение
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return (
      <img 
        src={imageUrl} 
        alt="Category icon" 
        className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 object-contain rounded"
        onError={(e) => {
          // Если изображение не загружается, показываем дефолтную иконку
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  
  // Дефолтная иконка
  return <TagIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400 flex-shrink-0" />;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyParents, setShowOnlyParents] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 50;
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

  // Mobile filters state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    imageUrl: '',
    parentId: null
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Icon upload state
  const [uploadedIcons, setUploadedIcons] = useState<Set<string>>(new Set());
  const [iconsToDelete, setIconsToDelete] = useState<Set<string>>(new Set());

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams({
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`/api/admin/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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

  // Block body scroll when modal is open
  useEffect(() => {
    const isModalOpen = isCreateModalOpen || isEditModalOpen || isDeleteModalOpen || isViewModalOpen;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCreateModalOpen, isEditModalOpen, isDeleteModalOpen, isViewModalOpen]);

  // Перезагружаем категории при изменении сортировки
  useEffect(() => {
    fetchCategories();
  }, [sortBy, sortOrder]);

  // Умный поиск - проверяет вхождение каждого слова
  const smartSearch = (text: string, searchQuery: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    const textWords = text.toLowerCase().split(/\s+/);
    const searchWords = searchQuery.toLowerCase().split(/\s+/);
    
    return searchWords.every(searchWord => 
      textWords.some(textWord => textWord.includes(searchWord))
    );
  };

  // Фильтрация категорий
  const filteredCategories = categories.filter(category => {
    const matchesSearch = smartSearch(category.name, searchTerm);
    const matchesFilter = !showOnlyParents || !category.parentId;
    return matchesSearch && matchesFilter;
  });

  // Сортировка уже происходит на сервере, используем отфильтрованные категории
  const sortedCategories = filteredCategories;

  // Пагинация
  const totalItems = sortedCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = sortedCategories.slice(startIndex, endIndex);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showOnlyParents, sortBy, sortOrder]);

  // Клавиатурные сокращения
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K для фокуса на поиск
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Построение дерева категорий
  const buildCategoryTree = (cats: Category[]): Category[] => {
    const tree: Category[] = [];
    const map = new Map<string, Category>();

    // Создаем мапу всех категорий
    cats.forEach(cat => map.set(cat.id, { ...cat, children: [] }));

    // Строим дерево
    cats.forEach(cat => {
      const category = map.get(cat.id)!;
      if (category.parentId) {
        const parent = map.get(category.parentId);
        if (parent) {
          parent.children.push(category);
        } else {
          tree.push(category); // Если родитель не найден, добавляем в корень
        }
      } else {
        tree.push(category);
      }
    });

    return tree;
  };

  const categoryTree = buildCategoryTree(paginatedCategories);

  // Переключение развернутого состояния
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Обработчики модальных окон
  const openCreateModal = () => {
    setFormData({ name: '', description: '', imageUrl: '', parentId: null });
    // Очищаем состояние загруженных иконок при открытии модального окна
    setUploadedIcons(new Set());
    setIconsToDelete(new Set());
    setIsCreateModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId
    });
    // Очищаем состояние загруженных иконок при открытии модального окна
    setUploadedIcons(new Set());
    setIconsToDelete(new Set());
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (category: Category) => {
    setViewingCategory(category);
    setIsViewModalOpen(true);
  };

  // Обработчики для работы с иконками
  const handleIconUpload = (iconUrl: string) => {
    setUploadedIcons(prev => new Set([...prev, iconUrl]));
  };

  const handleIconRemove = async (iconUrl: string) => {
    try {
      // Добавляем в список для удаления
      setIconsToDelete(prev => new Set([...prev, iconUrl]));
      
      // Удаляем из S3
      const response = await fetch(`/api/upload/delete?url=${encodeURIComponent(iconUrl)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        console.error('Failed to delete icon from S3');
      }
    } catch (error) {
      console.error('Error deleting icon:', error);
    }
  };

  const handleIconChange = (iconUrl: string | null) => {
    setFormData({ ...formData, imageUrl: iconUrl || '' });
  };

  const closeModals = async () => {
    // Удаляем все загруженные, но не сохраненные иконки
    for (const iconUrl of uploadedIcons) {
      await handleIconRemove(iconUrl);
    }
    
    // Очищаем состояние
    setUploadedIcons(new Set());
    setIconsToDelete(new Set());
    
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
    setViewingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '', parentId: null });
  };

  // Создание категории
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        // Очищаем состояние после успешного сохранения
        setUploadedIcons(new Set());
        setIconsToDelete(new Set());
        setIsCreateModalOpen(false);
        setFormData({ name: '', description: '', imageUrl: '', parentId: null });
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка создания категории');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Ошибка создания категории');
    } finally {
      setFormLoading(false);
    }
  };

  // Обновление категории
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        // Очищаем состояние после успешного сохранения
        setUploadedIcons(new Set());
        setIconsToDelete(new Set());
        setIsEditModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', imageUrl: '', parentId: null });
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка обновления категории');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Ошибка обновления категории');
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление категории
  const handleDelete = async () => {
    if (!deletingCategory) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCategories();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка удаления категории');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ошибка удаления категории');
    } finally {
      setFormLoading(false);
    }
  };

  // Рендер категории в дереве
  const renderCategoryRow = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0;

    return (
      <div key={category.id}>
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div 
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => openViewModal(category)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2 flex-1 min-w-0" style={{ paddingLeft: `${level * (level > 0 ? 12 : 0)}px` }}>
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(category.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0 mt-0.5"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-5 flex-shrink-0" />}
                
                {/* Иконка категории */}
                {renderCategoryIcon(category.imageUrl || null)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-white text-sm truncate">{category.name}</h3>
                    {category.parent && (
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded inline-block w-fit">
                        {category.parent.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <CubeIcon className="h-3 w-3 flex-shrink-0" />
                      <span>{category.productsCount} товаров</span>
                    </div>
                    {category.childrenCount > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <TagIcon className="h-3 w-3 flex-shrink-0" />
                        <span>{category.childrenCount} подкатегорий</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(category)}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => openDeleteModal(category)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div 
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => openViewModal(category)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0" style={{ paddingLeft: `${level * (level > 0 ? 16 : 0)}px` }}>
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(category.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-6 flex-shrink-0" />}
                
                {/* Иконка категории */}
                {renderCategoryIcon(category.imageUrl || null)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center gap-2">
                    <h3 className="font-medium text-white text-base truncate">{category.name}</h3>
                    {category.parent && (
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded inline-block w-fit">
                        {category.parent.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <CubeIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{category.productsCount} товаров</span>
                    </div>
                    {category.childrenCount > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <TagIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{category.childrenCount} подкатегорий</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(category)}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => openDeleteModal(category)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2 space-y-2">
            {category.children.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
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
              <h1 className="text-3xl font-bold text-white mb-2">Категории</h1>
              <p className="text-gray-300">Управление категориями товаров</p>
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
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 relative">
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
                    placeholder="Поиск категорий..."
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
                    <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 h-10">
                      <BarsArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                      >
                        <option value="popular" className="bg-gray-800">По популярности</option>
                        <option value="alphabetical" className="bg-gray-800">По алфавиту</option>
                        <option value="products" className="bg-gray-800">По товарам</option>
                      </select>
                      <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                    </div>
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
              {/* Filter Toggle - Full width on mobile */}
              <button
                onClick={() => setShowOnlyParents(!showOnlyParents)}
                className={`flex items-center justify-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-3 rounded-lg border transition-all duration-200 ${
                  showOnlyParents
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:border-gray-500/50'
                }`}
              >
                <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Только родительские</span>
                <div className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded border-2 transition-all duration-200 ${
                  showOnlyParents
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-400'
                }`}>
                  {showOnlyParents && (
                    <CheckIcon className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                  )}
                </div>
              </button>
            </div>

            {/* Mobile Filters - Collapsible */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              isMobileFiltersOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-4 pt-4 border-t border-gray-700/50">
                {/* Mobile Sort Controls */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Сортировка</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 h-10">
                        <BarsArrowUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                        >
                          <option value="popular" className="bg-gray-800">По популярности</option>
                          <option value="alphabetical" className="bg-gray-800">По алфавиту</option>
                          <option value="products" className="bg-gray-800">По товарам</option>
                        </select>
                        <ChevronUpDownIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      </div>
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
                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowOnlyParents(!showOnlyParents)}
                      className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg border transition-all duration-200 ${
                        showOnlyParents
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:border-gray-500/50'
                      }`}
                    >
                      <FunnelIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">Только родительские</span>
                      <div className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-all duration-200 ${
                        showOnlyParents
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-400'
                      }`}>
                        {showOnlyParents && (
                          <CheckIcon className="h-2 w-2 text-white" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

           {/* Stats Bar */}
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
                       <span className="sm:hidden">"{searchTerm}"</span>
                       <span className="hidden sm:inline">Поиск: "{searchTerm}"</span>
                     </span>
                   </div>
                 )}
               </div>


             </div>
           </div>
         </div>

        {/* Categories Tree */}
        <div className="space-y-3">
        {categoryTree.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <TagIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {searchTerm ? 'Категории не найдены' : 'Нет категорий'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Попробуйте изменить критерии поиска' : 'Создайте первую категорию для начала работы'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
              >
                Создать категорию
              </button>
            )}
          </div>
        ) : (
          categoryTree.map(category => renderCategoryRow(category))
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
                  {sortBy === 'popular' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <FireIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 flex-shrink-0" />
                      <span className="text-orange-400 font-medium hidden sm:inline">По популярности</span>
                      <span className="text-orange-400 font-medium sm:hidden">Популярности</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-orange-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-orange-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'alphabetical' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <BarsArrowUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                      <span className="text-green-400 font-medium hidden sm:inline">По алфавиту</span>
                      <span className="text-green-400 font-medium sm:hidden">Алфавиту</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'products' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <CubeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                      <span className="text-purple-400 font-medium hidden sm:inline">По товарам</span>
                      <span className="text-purple-400 font-medium sm:hidden">Товарам</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-purple-400 flex-shrink-0" />
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

                {/* Page Numbers - Fewer on mobile */}
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
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
                  {totalItems} категорий всего
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-md border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">Создать категорию</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Название категории
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите название..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите описание..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Иконка категории
                  </label>
                  <div className="mb-4">
                    <IconUpload
                      currentIconUrl={formData.imageUrl}
                      onIconChange={handleIconChange}
                      onIconUpload={handleIconUpload}
                      onIconRemove={handleIconRemove}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Родительская категория
                  </label>
                  <select
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Нет (корневая категория)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent ? `${cat.parent.name} → ${cat.name}` : cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {formLoading ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

             {/* Edit Modal */}
       {isEditModalOpen && editingCategory && (
         <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
           <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-md border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">Редактировать категорию</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Название категории
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите название..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите описание..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Иконка категории
                  </label>
                  <div className="mb-4">
                    <IconUpload
                      currentIconUrl={formData.imageUrl}
                      onIconChange={handleIconChange}
                      onIconUpload={handleIconUpload}
                      onIconRemove={handleIconRemove}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Родительская категория
                  </label>
                  <select
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Нет (корневая категория)</option>
                    {categories
                      .filter(cat => cat.id !== editingCategory.id) // Исключаем саму категорию
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.parent ? `${cat.parent.name} → ${cat.name}` : cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {formLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

             {/* Delete Modal */}
       {isDeleteModalOpen && deletingCategory && (
         <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-lg border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Удалить категорию</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                <div className="mb-6">
                  {(deletingCategory.productsCount > 0 || deletingCategory.childrenCount > 0) ? (
                    <div className="space-y-4">
                      {/* Заголовок с иконкой */}
                      <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-red-300 mb-2">
                            Нельзя удалить категорию
                          </h3>
                          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                            Категория <span className="font-semibold text-white">"{deletingCategory.name}"</span> содержит данные и не может быть удалена.
                          </p>
                        </div>
                      </div>
                      
                      {/* Детали блокировки */}
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 sm:p-6">
                        <h4 className="text-base sm:text-lg font-semibold text-red-300 mb-4">
                          Причины блокировки удаления:
                        </h4>
                        <div className="space-y-3">
                          {deletingCategory.productsCount > 0 && (
                            <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg">
                              <CubeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                              <span className="text-red-300 font-medium text-sm sm:text-base">
                                Содержит {deletingCategory.productsCount} товаров
                              </span>
                            </div>
                          )}
                          {deletingCategory.childrenCount > 0 && (
                            <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg">
                              <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                              <span className="text-red-300 font-medium text-sm sm:text-base">
                                Содержит {deletingCategory.childrenCount} подкатегорий
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-300 text-xs sm:text-sm font-medium">
                            💡 Сначала переместите или удалите все товары и подкатегории из этой категории
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Заголовок с иконкой */}
                      <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <TrashIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-yellow-300 mb-2">
                            Подтверждение удаления
                          </h3>
                          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                            Вы уверены, что хотите удалить категорию <span className="font-semibold text-white">"{deletingCategory.name}"</span>?
                          </p>
                        </div>
                      </div>
                      
                      {/* Предупреждение */}
                      <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-4 sm:p-6">
                        <div className="flex items-start space-x-3">
                          <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-300 text-xs sm:text-sm font-medium mb-1">
                              Внимание
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              Это действие необратимо. Категория будет удалена навсегда.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Кнопки */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={closeModals}
                    className="flex-1 px-4 sm:px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    {(deletingCategory.productsCount > 0 || deletingCategory.childrenCount > 0) ? 'Понятно' : 'Отмена'}
                  </button>
                  {(deletingCategory.productsCount === 0 && deletingCategory.childrenCount === 0) && (
                    <button
                      onClick={handleDelete}
                      disabled={formLoading}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-red-500/25 text-sm sm:text-base"
                    >
                      {formLoading ? 'Удаление...' : 'Удалить'}
                    </button>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

        {/* View Modal */}
        {isViewModalOpen && viewingCategory && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-4xl border border-gray-700/50 shadow-2xl mx-2 sm:mx-4 max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Информация о категории</h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                <div className="space-y-4 sm:space-y-6">
                  {/* Основная информация */}
                  <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gray-600/30 rounded-lg">
                          {viewingCategory.imageUrl ? (
                            <img 
                              src={viewingCategory.imageUrl} 
                              alt="Category icon" 
                              className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded"
                            />
                          ) : (
                            <TagIcon className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                          {viewingCategory.name}
                        </h3>
                        {viewingCategory.description && (
                          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            {viewingCategory.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-gray-600/30 rounded-lg p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <CubeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {viewingCategory.productsCount}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">Товаров</div>
                      </div>

                      <div className="bg-gray-600/30 rounded-lg p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {viewingCategory.childrenCount}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">Подкатегорий</div>
                      </div>

                      <div className="bg-gray-600/30 rounded-lg p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          {viewingCategory.parent ? (
                            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {viewingCategory.parent ? 'Подкатегория' : 'Родительская'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Родительская категория */}
                  {viewingCategory.parent && (
                    <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-3">
                        Родительская категория
                      </h4>
                      <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-600/30 rounded-lg">
                        <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-300 font-medium text-sm sm:text-base">
                          {viewingCategory.parent.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Подкатегории */}
                  {viewingCategory.children && viewingCategory.children.length > 0 && (
                    <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-3">
                        Подкатегории ({viewingCategory.children.length})
                      </h4>
                      <div className="max-h-32 sm:max-h-48 overflow-y-auto space-y-2 pr-2">
                        {viewingCategory.children.map((child) => (
                          <div key={child.id} className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-600/30 rounded-lg">
                            <TagIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-300 text-sm sm:text-base">{child.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
