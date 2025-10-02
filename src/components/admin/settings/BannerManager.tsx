'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

interface BannerManagerProps {
  onBannersChange?: (banners: string[]) => void;
}

export default function BannerManager({ onBannersChange }: BannerManagerProps) {
  const { showSuccess, showError } = useToast();
  const [banners, setBanners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [validatingImage, setValidatingImage] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBanners();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ESC key for closing modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showPreviewModal) {
          setShowPreviewModal(false);
        } else if (showDeleteConfirm) {
          cancelDeleteBanner();
        } else if (showAddModal) {
          setShowAddModal(false);
          setNewBannerUrl('');
          setValidationError('');
        } else if (showEditModal) {
          setShowEditModal(false);
          setEditingIndex(null);
          setEditingUrl('');
          setValidationError('');
        }
      }
    };

    if (showPreviewModal || showDeleteConfirm || showAddModal || showEditModal) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showPreviewModal, showDeleteConfirm, showAddModal, showEditModal]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      const bannersData = data.add_banners;
      
      if (bannersData) {
        try {
          const parsedBanners = JSON.parse(bannersData);
          setBanners(Array.isArray(parsedBanners) ? parsedBanners : []);
        } catch {
          setBanners([]);
        }
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      showError('Ошибка загрузки', 'Не удалось загрузить баннеры');
    } finally {
      setLoading(false);
    }
  };

  const saveBanners = async (newBanners: string[]) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'banners',
          banners: newBanners
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save banners');
      }

      setBanners(newBanners);
      onBannersChange?.(newBanners);
      showSuccess('Баннеры обновлены', 'Изменения успешно сохранены');
    } catch (err) {
      console.error('Error saving banners:', err);
      showError('Ошибка сохранения', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBanner = async () => {
    setValidationError('');
    
    if (!newBannerUrl.trim()) {
      setValidationError('Введите URL баннера');
      return;
    }

    if (!isValidUrl(newBannerUrl)) {
      setValidationError('Введите корректный URL');
      return;
    }

    // Валидируем изображение
    setValidatingImage(true);
    const validation = await validateImageUrl(newBannerUrl.trim());
    setValidatingImage(false);

    if (!validation.valid) {
      setValidationError(validation.error || 'Ошибка валидации изображения');
      return;
    }

    const newBanners = [...banners, newBannerUrl.trim()];
    await saveBanners(newBanners);
    setNewBannerUrl('');
    setValidationError('');
    setShowAddModal(false);
  };

  const handleEditBanner = async () => {
    if (editingIndex === null) return;
    setValidationError('');

    if (!editingUrl.trim()) {
      setValidationError('Введите URL баннера');
      return;
    }

    if (!isValidUrl(editingUrl)) {
      setValidationError('Введите корректный URL');
      return;
    }

    // Валидируем изображение
    setValidatingImage(true);
    const validation = await validateImageUrl(editingUrl.trim());
    setValidatingImage(false);

    if (!validation.valid) {
      setValidationError(validation.error || 'Ошибка валидации изображения');
      return;
    }

    const newBanners = [...banners];
    newBanners[editingIndex] = editingUrl.trim();
    await saveBanners(newBanners);
    setEditingIndex(null);
    setEditingUrl('');
    setValidationError('');
    setShowEditModal(false);
  };

  const handleDeleteBanner = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBanner = async () => {
    if (deleteIndex !== null) {
      const newBanners = banners.filter((_, i) => i !== deleteIndex);
      await saveBanners(newBanners);
      setShowDeleteConfirm(false);
      setDeleteIndex(null);
    }
  };

  const cancelDeleteBanner = () => {
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    // Set cursor to grabbing for the entire document during drag
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newBanners = [...banners];
    const draggedBanner = newBanners[draggedIndex];
    
    // Remove the dragged item
    newBanners.splice(draggedIndex, 1);
    
    // Insert at new position
    newBanners.splice(dropIndex, 0, draggedBanner);
    
    await saveBanners(newBanners);
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Reset cursor and user selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Reset cursor and user selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setEditingUrl(banners[index]);
    setShowEditModal(true);
  };

  const openPreviewModal = (url: string) => {
    setPreviewUrl(url);
    setShowPreviewModal(true);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateImageUrl = async (url: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      // Проверяем базовую валидность URL
      if (!isValidUrl(url)) {
        return { valid: false, error: 'Некорректный URL' };
      }

      // Создаем изображение для проверки
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';

      return new Promise<{ valid: boolean; error?: string }>((resolve) => {
        img.onload = async () => {
          try {
            // Проверяем разрешение
            if (img.naturalWidth !== 1920 || img.naturalHeight !== 800) {
              resolve({
                valid: false,
                error: `Неверное разрешение: ${img.naturalWidth}x${img.naturalHeight}. Требуется: 1920x800 пикселей`
              });
              return;
            }

            // Проверяем размер файла
            try {
              const response = await fetch(url, { method: 'HEAD' });
              const contentLength = response.headers.get('content-length');
              const contentType = response.headers.get('content-type');

              // Проверяем формат
              const validFormats = [
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/webp',
                'image/gif',
                'image/bmp',
                'image/svg+xml'
              ];

              if (!contentType || !validFormats.some(format => contentType.includes(format))) {
                resolve({
                  valid: false,
                  error: `Неподдерживаемый формат: ${contentType || 'неизвестно'}. Поддерживаются: JPEG, PNG, WebP, GIF, BMP, SVG`
                });
                return;
              }

              // Проверяем размер файла (5 МБ = 5 * 1024 * 1024 байт)
              if (contentLength) {
                const sizeInMB = parseInt(contentLength) / (1024 * 1024);
                if (sizeInMB > 5) {
                  resolve({
                    valid: false,
                    error: `Размер файла слишком большой: ${sizeInMB.toFixed(2)} МБ. Максимум: 5 МБ`
                  });
                  return;
                }
              }

              resolve({ valid: true });
            } catch {
              resolve({
                valid: false,
                error: 'Ошибка при проверке изображения'
              });
            }
          } catch {
            resolve({
              valid: false,
              error: 'Ошибка при проверке изображения'
            });
          }
        };

        img.onerror = () => {
          resolve({
            valid: false,
            error: 'Не удалось загрузить изображение. Проверьте URL'
          });
        };

        img.src = url;
      });
    } catch {
      return {
        valid: false,
        error: 'Ошибка при валидации изображения'
      };
    }
  };

  // Drag handle icon component (6 dots)
  const DragHandle = () => (
    <div className="flex flex-col space-y-1 p-1">
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
      </div>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
      </div>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-white">Баннеры ({banners.length})</h3>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Добавить</span>
          </button>
        </div>
      </div>

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Нет баннеров</h3>
          <p className="text-gray-500 mb-4">Добавьте первый баннер для отображения в приложении</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Добавить баннер
          </button>
        </div>
      ) : (
        <div className="space-y-3">
           {banners.map((banner, index) => (
             <div
               key={index}
               draggable
               onDragStart={(e) => handleDragStart(e, index)}
               onDragOver={(e) => handleDragOver(e, index)}
               onDragLeave={handleDragLeave}
               onDrop={(e) => handleDrop(e, index)}
               onDragEnd={handleDragEnd}
               className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 group ${
                 draggedIndex === index
                   ? 'bg-blue-500/20 border-blue-500/50 opacity-50 cursor-grabbing'
                   : dragOverIndex === index
                   ? 'bg-green-500/20 border-green-500/50 cursor-pointer'
                   : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 cursor-grab hover:cursor-grab'
               }`}
               onClick={() => openPreviewModal(banner)}
               title="Нажмите для предварительного просмотра • Перетащите для изменения порядка"
             >
               {/* Drag Handle */}
               <div className={`flex-shrink-0 ${
                 draggedIndex === index ? 'cursor-grabbing' : 'cursor-grab'
               }`}>
                 <DragHandle />
               </div>

               {/* Banner Preview */}
               <div className="flex-shrink-0">
                 <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden relative">
                   <Image
                     src={banner}
                     alt={`Banner ${index + 1}`}
                     fill
                     className="object-cover group-hover:scale-105 transition-transform duration-200"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI4IiBjeT0iMjgiIHI9IjMiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTIwIDM2TDI4IDI4TDM2IDM2TDQ0IDI4IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K';
                     }}
                     unoptimized
                   />
                 </div>
               </div>

               {/* Banner Info */}
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-white mb-1 group-hover:text-blue-300 transition-colors">
                   Баннер #{index + 1}
                 </p>
                 <p className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">
                   {banner}
                 </p>
               </div>

               {/* Preview indicator */}
               <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2">
                 <div className="p-1 bg-blue-500/20 rounded-full">
                   <EyeIcon className="h-3 w-3 text-blue-400" />
                 </div>
               </div>

               {/* Actions */}
               <div className="flex items-center space-x-2">
                 {/* Edit */}
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     openEditModal(index);
                   }}
                   disabled={saving}
                   className="p-2 text-gray-400 hover:text-yellow-400 disabled:opacity-50 transition-colors"
                   title="Редактировать"
                 >
                   <PencilIcon className="h-4 w-4" />
                 </button>

                 {/* Delete */}
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleDeleteBanner(index);
                   }}
                   disabled={saving}
                   className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                   title="Удалить"
                 >
                   <TrashIcon className="h-4 w-4" />
                 </button>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* Add Banner Modal - Rendered using Portal at document body level */}
      {showAddModal && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => {
            setShowAddModal(false);
            setNewBannerUrl('');
            setValidationError('');
          }}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Добавить баннер</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewBannerUrl('');
                  setValidationError('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL баннера
                </label>
                <input
                  type="url"
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/banner.jpg"
                  autoFocus
                />
                
                {/* Requirements info */}
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-xs font-semibold text-blue-300 mb-1">Требования к изображению:</h4>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• Разрешение: строго 1920x800 пикселей</li>
                    <li>• Размер файла: не более 5 МБ</li>
                    <li>• Формат: JPEG, PNG, WebP, GIF, BMP, SVG</li>
                  </ul>
                </div>

                {validationError && (
                  <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
                    <ExclamationCircleIcon className="h-4 w-4" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewBannerUrl('');
                    setValidationError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddBanner}
                  disabled={saving || validatingImage || !newBannerUrl.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {validatingImage ? 'Проверка...' : saving ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Banner Modal - Rendered using Portal at document body level */}
      {showEditModal && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => {
            setShowEditModal(false);
            setEditingIndex(null);
            setEditingUrl('');
            setValidationError('');
          }}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Редактировать баннер #{(editingIndex ?? 0) + 1}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingIndex(null);
                  setEditingUrl('');
                  setValidationError('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL баннера
                </label>
                <input
                  type="url"
                  value={editingUrl}
                  onChange={(e) => setEditingUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/banner.jpg"
                  autoFocus
                />
                
                {/* Requirements info */}
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-xs font-semibold text-blue-300 mb-1">Требования к изображению:</h4>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• Разрешение: строго 1920x800 пикселей</li>
                    <li>• Размер файла: не более 5 МБ</li>
                    <li>• Формат: JPEG, PNG, WebP, GIF, BMP, SVG</li>
                  </ul>
                </div>

                {validationError && (
                  <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
                    <ExclamationCircleIcon className="h-4 w-4" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIndex(null);
                    setEditingUrl('');
                    setValidationError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleEditBanner}
                  disabled={saving || validatingImage || !editingUrl.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {validatingImage ? 'Проверка...' : saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal - Rendered using Portal at document body level */}
      {showPreviewModal && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowPreviewModal(false)}
        >
           <div 
             className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Close button */}
             <div className="absolute top-4 right-4 z-10">
               <button
                 onClick={() => setShowPreviewModal(false)}
                 className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
                 title="Закрыть (ESC)"
               >
                 <XMarkIcon className="h-6 w-6" />
               </button>
             </div>
            
             {/* Image container */}
             <div className="flex-1 flex items-center justify-center p-8">
               <div className="relative w-full h-full max-w-[90vw] max-h-[85vh]">
                 <Image
                   src={previewUrl}
                   alt="Banner Preview"
                   fill
                   className="object-contain rounded-lg shadow-2xl"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk9zaGlia2EgemFncnV6a2kgaXpvYnJhemhlbml5YTwvdGV4dD4KPC9zdmc+';
                   }}
                   unoptimized
                 />
               </div>
             </div>
            
            {/* URL info */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/90 text-sm break-all font-mono text-center">
                  {previewUrl}
                </p>
              </div>
            </div>
           </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={cancelDeleteBanner}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrashIcon className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Удалить баннер</h3>
                <p className="text-sm text-gray-400">Это действие нельзя отменить</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-3">
                Вы уверены, что хотите удалить баннер #{(deleteIndex ?? 0) + 1}?
              </p>
              
              {deleteIndex !== null && banners[deleteIndex] && (
                 <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
                   <div className="flex items-center space-x-3">
                     <div className="w-12 h-12 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0 relative">
                       <Image
                         src={banners[deleteIndex]}
                         alt={`Banner ${deleteIndex + 1}`}
                         fill
                         className="object-cover"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNiAxNkgzMlYzMkgxNlYxNloiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjIyIiBjeT0iMjIiIHI9IjIiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTE2IDI4TDIyIDIyTDI4IDI4TDMyIDIyIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K';
                         }}
                         unoptimized
                       />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-xs text-gray-400 truncate">
                         {banners[deleteIndex]}
                       </p>
                     </div>
                   </div>
                 </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteBanner}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteBanner}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {saving ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
