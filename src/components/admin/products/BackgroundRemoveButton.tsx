'use client';

import React, { useState } from 'react';
import { 
  PaintBrushIcon, 
  ArrowUturnLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface BackgroundRemoveButtonProps {
  imageUrl: string;
  onImageChange: (newUrl: string) => void;
  onRevert?: (originalUrl: string, processedUrl: string) => void;
  isProcessed?: boolean;
  originalUrl?: string;
  className?: string;
}

export default function BackgroundRemoveButton({
  imageUrl,
  onImageChange,
  onRevert,
  isProcessed = false,
  originalUrl,
  className = ''
}: BackgroundRemoveButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveBackground = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/upload/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка удаления фона');
      }

      if (result.success && result.processedUrl) {
        onImageChange(result.processedUrl);
      } else {
        throw new Error('Не удалось получить обработанное изображение');
      }
    } catch (error) {
      console.error('Background removal error:', error);
      setError(error instanceof Error ? error.message : 'Ошибка удаления фона');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevert = () => {
    if (onRevert && originalUrl) {
      onRevert(originalUrl, imageUrl);
    }
  };

  if (isProcessed) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={handleRevert}
          disabled={isProcessing}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          title="Вернуть оригинал"
        >
          <ArrowUturnLeftIcon className="h-3 w-3" />
        </button>
        
        {/* Индикатор обработанного изображения */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center">
          <CheckIcon className="h-2 w-2 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleRemoveBackground}
        disabled={isProcessing}
        className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-1.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        title={isProcessing ? 'Обработка...' : 'Удалить фон'}
      >
        {isProcessing ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <PaintBrushIcon className="h-3 w-3" />
        )}
      </button>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-1 hover:text-red-200"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
