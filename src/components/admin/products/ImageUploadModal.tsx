'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  XMarkIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  LinkIcon,
  FolderOpenIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ToastContainer } from './Toast';
import { useToast } from '@/hooks/useToast';
import ImageViewer from './ImageViewer';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesUpdate: (images: string[]) => void;
  currentImages: string[];
}

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  s3Url?: string;
}

interface ImageData {
  url: string;
  isMain: boolean;
  uploading?: boolean;
  file?: File;
  tempId?: string;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImagesUpdate,
  currentImages
}: ImageUploadModalProps) {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [images, setImages] = useState<ImageData[]>(
    (currentImages || []).map((url, index) => ({ url, isMain: index === 0 }))
  );
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обновляем images когда currentImages изменяется
  useEffect(() => {
    setImages((currentImages || []).map((url, index) => ({ url, isMain: index === 0 })));
  }, [currentImages]);

  // Реальная загрузка файла в S3
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка загрузки файла');
    }

    const result = await response.json();
    return result.url;
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      showError('Неверный формат', 'Пожалуйста, выберите файлы изображений (JPG, PNG, WebP)');
      return;
    }

    // Создаем временные превью для отображения во время загрузки
    const tempImages: ImageData[] = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      isMain: false,
      uploading: true,
      file: file,
      tempId: Date.now().toString() + Math.random().toString()
    }));

    // Добавляем временные изображения в галерею
    setImages(prev => [...prev, ...tempImages]);

    // Загружаем файлы параллельно
    const uploadPromises = validFiles.map(async (file, index) => {
      const tempId = tempImages[index].tempId;
      try {
        const url = await uploadFile(file);
        
        // Заменяем временное изображение на загруженное
        setImages(prev => prev.map(img => 
          img.tempId === tempId 
            ? { url, isMain: false, uploading: false }
            : img
        ));
        
        // Очищаем временный blob URL
        URL.revokeObjectURL(tempImages[index].url);
        
        return url;
      } catch (error) {
        // Удаляем изображение при ошибке
        setImages(prev => prev.filter(img => img.tempId !== tempId));
        URL.revokeObjectURL(tempImages[index].url);
        
        showError('Ошибка загрузки', `Не удалось загрузить файл ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(Boolean).length;
    
    if (successCount > 0) {
      showSuccess('Файлы загружены', `Успешно загружено ${successCount} из ${validFiles.length} файлов`);
    }
  }, [showError, showSuccess]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };



  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    
    // Простая валидация URL
    try {
      new URL(urlInput);
      const newImage = { url: urlInput.trim(), isMain: false };
      setImages(prev => [...prev, newImage]);
      setUrlInput('');
      showSuccess('URL добавлен', 'Изображение по ссылке добавлено');
    } catch {
      showError('Неверная ссылка', 'Пожалуйста, введите корректный URL изображения');
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];
    
    // Если это изображение из S3, удаляем его
    if (imageToRemove.url.includes(process.env.NEXT_PUBLIC_S3_URL || 's3.twcstorage.ru')) {
      try {
        const response = await fetch(`/api/upload/delete?url=${encodeURIComponent(imageToRemove.url)}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Ошибка удаления файла');
        }
        
        showSuccess('Файл удален', 'Изображение успешно удалено из хранилища');
      } catch (error) {
        showError('Ошибка удаления', 'Не удалось удалить файл из хранилища');
        return;
      }
    }
    
    // Удаляем из локального состояния
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Если удаляем главное изображение, делаем главным первое
      if (imageToRemove.isMain && newImages.length > 0) {
        newImages[0].isMain = true;
      }
      return newImages;
    });
  };

  const handleSetMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isMain: i === index
    })));
  };

  const handleViewImage = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };



  const handleSave = () => {
    // Фильтруем только загруженные изображения
    const uploadedImages = images.filter(img => !img.uploading);
    
    // Проверяем, есть ли загружающиеся изображения
    const uploadingCount = images.filter(img => img.uploading).length;
    if (uploadingCount > 0) {
      showError('Подождите загрузку', `Еще загружается ${uploadingCount} изображений`);
      return;
    }
    
    // Сортируем изображения: главное первым
    const sortedImages = [...uploadedImages].sort((a, b) => {
      if (a.isMain) return -1;
      if (b.isMain) return 1;
      return 0;
    });
    
    onImagesUpdate(sortedImages.map(img => img.url));
    showSuccess('Изображения сохранены', `Добавлено ${uploadedImages.length} изображений`);
    onClose();
  };

  const handleClose = () => {
    // Очищаем временные blob URLs
    images.forEach(image => {
      if (image.tempId && image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
    });
    
    setUploadFiles([]);
    setImages(currentImages.map((url, index) => ({ url, isMain: index === 0 }))); // Сбрасываем к исходному состоянию
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center p-4 z-[60]">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <PhotoIcon className="h-6 w-6" />
            <span>Управление фотографиями</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>



        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Combined Upload Interface */}
          <div className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">
                Добавить изображения
              </h3>
              <p className="text-gray-400 mb-4">
                Перетащите файлы сюда, выберите с компьютера или добавьте по ссылке
              </p>
              
              {/* Upload Methods */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <FolderOpenIcon className="h-4 w-4" />
                  <span>Выбрать файлы</span>
                </button>
              </div>

              {/* URL Input */}
              <div className="flex space-x-2 max-w-md mx-auto">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
                  className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  onClick={handleUrlAdd}
                  disabled={!urlInput.trim()}
                  className="bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, WebP до 10MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>



            {/* Current Images Gallery */}
            <div className="space-y-3">
              <h4 className="font-medium text-white flex items-center space-x-2">
                <PhotoIcon className="h-5 w-5" />
                <span>Добавленные изображения ({images.filter(img => !img.uploading).length})</span>
                {images.some(img => img.uploading) && (
                  <span className="text-indigo-400 text-sm">
                    (загружается {images.filter(img => img.uploading).length})
                  </span>
                )}
              </h4>
              
              {images.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-700/20 rounded-lg border border-gray-600/30">
                  <PhotoIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">Изображения не добавлены</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <div key={image.tempId || index} className="relative group">
                      <div className={`w-full h-24 rounded-lg overflow-hidden bg-gray-600 border-2 transition-colors ${
                        image.uploading ? 'cursor-wait' : 'cursor-pointer hover:border-indigo-400'
                      }`}
                           style={{ borderColor: image.isMain ? '#fbbf24' : '' }}
                           onClick={() => !image.uploading && handleViewImage(index)}>
                        <img
                          src={image.url}
                          alt={`Изображение ${index + 1}`}
                          className={`w-full h-full object-cover transition-opacity ${
                            image.uploading ? 'opacity-60' : 'opacity-100'
                          }`}
                        />
                        
                        {/* Индикатор загрузки */}
                        {image.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-white font-medium">Загрузка...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-1 left-1 flex space-x-1">
                        {image.isMain && (
                          <div className="bg-yellow-500 text-white text-xs px-1 py-0.5 rounded flex items-center space-x-1">
                            <StarIconSolid className="h-2 w-2" />
                            <span>Главное</span>
                          </div>
                        )}
                        <div className="bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>

                      {/* Actions - скрываем во время загрузки */}
                      {!image.uploading && (
                        <div className="absolute -top-1 -right-1 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!image.isMain && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetMainImage(index);
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              title="Сделать главным"
                            >
                              <StarIcon className="h-2 w-2" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            title="Удалить"
                          >
                            <XMarkIcon className="h-2 w-2" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-800/50 border-t border-gray-700/50">
          <div className="text-sm text-gray-400">
            Загружено изображений: {images.filter(img => !img.uploading).length}
            {images.some(img => img.uploading) && (
              <span className="text-indigo-400 ml-2">
                • Загружается: {images.filter(img => img.uploading).length}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={images.some(img => img.uploading)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                images.some(img => img.uploading)
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600'
              }`}
            >
              {images.some(img => img.uploading) 
                ? `Загружается... (${images.filter(img => img.uploading).length})`
                : `Сохранить (${images.filter(img => !img.uploading).length})`
              }
            </button>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

        {/* Image Viewer */}
        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          images={images}
          currentIndex={viewerIndex}
          onSetMain={handleSetMainImage}
          onDelete={handleRemoveImage}
        />
      </div>
    </div>
  );
}
