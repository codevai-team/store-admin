'use client';

import React, { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  XMarkIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import BackgroundRemoveButton from './BackgroundRemoveButton';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  onClearAll?: () => void;
  originalImages?: string[]; // Для отслеживания оригинальных изображений
  resetState?: boolean; // Флаг для сброса состояния
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  onClearAll,
  originalImages = [],
  resetState = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [originalImagesState, setOriginalImagesState] = useState<string[]>([]);
  const [processedImages, setProcessedImages] = useState<Set<number>>(new Set()); // Отслеживаем обработанные изображения
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Инициализируем состояние оригинальных изображений только один раз
  React.useEffect(() => {
    if (originalImages.length > 0) {
      setOriginalImagesState(originalImages);
    }
  }, [originalImages]);

  // Сброс состояния при изменении флага resetState
  React.useEffect(() => {
    if (resetState) {
      setOriginalImagesState([]);
      setProcessedImages(new Set());
      setUploadError(null);
    }
  }, [resetState]);

  // Обновляем оригинальные изображения только при добавлении новых
  React.useEffect(() => {
    if (images.length > 0) {
      setOriginalImagesState(prev => {
        const newState = [...prev];
        // Добавляем только новые изображения, не перезаписывая существующие
        for (let i = 0; i < images.length; i++) {
          if (!newState[i]) {
            newState[i] = images[i];
          }
        }
        return newState;
      });
    }
  }, [images.length]); // Только при изменении количества изображений

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (images.length >= maxImages) {
      setUploadError(`Максимальное количество изображений: ${maxImages}`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = files.slice(0, maxImages - images.length).map(async (file) => {
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} не является изображением`);
        }

        // Проверяем размер файла (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} слишком большой (максимум 10MB)`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка загрузки');
        }

        const result = await response.json();
        return result.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки файлов');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    try {
      // Удаляем файл из S3
      const response = await fetch(`/api/upload?fileUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete image from S3');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }

    // Удаляем изображение из списка
    const newImages = images.filter((_, i) => i !== index);
    
    // Обновляем индексы в processedImages
    setProcessedImages(prev => {
      const newSet = new Set<number>();
      prev.forEach(processedIndex => {
        if (processedIndex < index) {
          // Индексы до удаленного остаются без изменений
          newSet.add(processedIndex);
        } else if (processedIndex > index) {
          // Индексы после удаленного сдвигаются на -1
          newSet.add(processedIndex - 1);
        }
        // processedIndex === index не добавляем (удаляем)
      });
      return newSet;
    });
    
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Обработка удаления фона
  const handleBackgroundRemove = (index: number, newUrl: string) => {
    const newImages = [...images];
    newImages[index] = newUrl;
    
    // Сохраняем оригинальный URL перед заменой
    const newOriginalImages = [...originalImagesState];
    if (!newOriginalImages[index]) {
      newOriginalImages[index] = images[index];
    }
    setOriginalImagesState(newOriginalImages);
    
    // Отмечаем изображение как обработанное
    setProcessedImages(prev => new Set([...prev, index]));
    
    onImagesChange(newImages);
  };

  // Обработка возврата к оригиналу
  const handleRevertToOriginal = async (originalUrl: string, processedUrl: string) => {
    // Удаляем обработанное изображение из S3
    try {
      await fetch(`/api/upload?fileUrl=${encodeURIComponent(processedUrl)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting processed image:', error);
    }
    
    // Обновляем изображение на оригинальное
    const newImages = [...images];
    const index = newImages.findIndex(img => img === processedUrl);
    if (index !== -1) {
      newImages[index] = originalUrl;
      
      // Убираем изображение из списка обработанных
      setProcessedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      
      onImagesChange(newImages);
    }
  };

  // Проверка, является ли изображение обработанным
  const isImageProcessed = (index: number) => {
    return processedImages.has(index);
  };

  // Обновляем оригинальные изображения при изменении текущих
  React.useEffect(() => {
    if (images.length > originalImagesState.length) {
      // Добавились новые изображения
      const newOriginalImages = [...originalImagesState];
      for (let i = originalImagesState.length; i < images.length; i++) {
        newOriginalImages[i] = images[i];
      }
      setOriginalImagesState(newOriginalImages);
    }
  }, [images, originalImagesState]);

  // Функция для очистки всех изображений (используется при отмене)
  const clearAllImages = async () => {
    for (const imageUrl of images) {
      try {
        await fetch(`/api/upload?fileUrl=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    onImagesChange([]);
  };

  // Экспортируем функцию очистки для использования в родительском компоненте
  React.useImperativeHandle(onClearAll, () => clearAllImages, [images]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${dragActive 
            ? 'border-indigo-400 bg-indigo-500/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <CloudArrowUpIcon className="h-12 w-12 text-indigo-400 animate-pulse mb-3" />
              <p className="text-white font-medium">Загрузка...</p>
              <p className="text-gray-400 text-sm">Пожалуйста, подождите</p>
            </>
          ) : images.length >= maxImages ? (
            <>
              <PhotoIcon className="h-12 w-12 text-gray-500 mb-3" />
              <p className="text-gray-400">Достигнуто максимальное количество изображений</p>
            </>
          ) : (
            <>
              <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-white font-medium mb-1">
                Перетащите изображения сюда или нажмите для выбора
              </p>
              <p className="text-gray-400 text-sm">
                PNG, JPG, WEBP до 10MB ({images.length}/{maxImages})
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="w-full h-24 bg-gray-700/30 rounded-lg border border-gray-600 overflow-hidden flex items-center justify-center">
                <img
                  src={url}
                  alt={`Изображение ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Кнопка удаления фона/возврата в правом верхнем углу */}
              <div className="absolute top-1 right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 rounded-full p-0.5">
                  <BackgroundRemoveButton
                    imageUrl={url}
                    onImageChange={(newUrl) => handleBackgroundRemove(index, newUrl)}
                    onRevert={handleRevertToOriginal}
                    isProcessed={isImageProcessed(index)}
                    originalUrl={originalImagesState[index]}
                  />
                </div>
              </div>

              {/* Кнопка удаления в левом верхнем углу */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-1 left-1 p-1.5 bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg border border-red-500"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
