'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface IconUploadProps {
  currentIconUrl?: string | null;
  onIconChange: (iconUrl: string | null) => void;
  onIconUpload: (iconUrl: string) => void;
  onIconRemove: (iconUrl: string) => void;
}

interface UploadState {
  uploading: boolean;
  error?: string;
  success?: boolean;
}

export default function IconUpload({
  currentIconUrl,
  onIconChange,
  onIconUpload,
  onIconRemove
}: IconUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки файла в S3
  const uploadToS3 = async (file: File): Promise<string> => {
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

  // Обработка выбора файла
  const handleFileSelect = useCallback(async (file: File) => {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setUploadState({ uploading: false, error: 'Можно загружать только изображения' });
      return;
    }

    // Проверяем размер файла (максимум 5MB для иконок)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setUploadState({ uploading: false, error: 'Размер файла не должен превышать 5MB' });
      return;
    }

    setUploadState({ uploading: true, error: undefined });

    try {
      // Если есть текущая иконка, удаляем её из S3
      if (currentIconUrl) {
        await onIconRemove(currentIconUrl);
      }

      // Загружаем новый файл
      const uploadedUrl = await uploadToS3(file);
      
      setUploadState({ uploading: false, success: true });
      onIconChange(uploadedUrl);
      onIconUpload(uploadedUrl);

      // Сбрасываем успех через 2 секунды
      setTimeout(() => {
        setUploadState({ uploading: false });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState({ 
        uploading: false, 
        error: error instanceof Error ? error.message : 'Ошибка загрузки файла' 
      });
    }
  }, [currentIconUrl, onIconChange, onIconUpload, onIconRemove]);

  // Обработка drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Обработка клика по области загрузки
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Обработка выбора файла через input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Удаление иконки
  const handleRemove = async () => {
    if (currentIconUrl) {
      await onIconRemove(currentIconUrl);
      onIconChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Область загрузки */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${uploadState.uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploadState.uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-sm text-gray-400">Загрузка...</p>
          </div>
        ) : currentIconUrl ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <img
                src={currentIconUrl}
                alt="Category icon"
                className="h-24 w-24 object-contain rounded-lg border-2 border-gray-600 bg-gray-800/50"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <CheckIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-400 font-medium">Заменить иконку</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">
                Перетащите изображение сюда или нажмите для выбора
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF до 5MB
              </p>
            </div>
          </div>
        )}

        {uploadState.error && (
          <div className="mt-3 flex items-center space-x-2 text-red-400">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">{uploadState.error}</span>
          </div>
        )}
      </div>

      {/* Информация о текущей иконке */}
      {currentIconUrl && (
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <PhotoIcon className="h-4 w-4" />
            <span>Иконка: {currentIconUrl.split('/').pop()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
