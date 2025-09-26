'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    url: string;
  }>;
  currentIndex: number;
  onDelete: (index: number) => void;
}

export default function ImageViewer({
  isOpen,
  onClose,
  images,
  currentIndex,
  onDelete,
}: ImageViewerProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[activeIndex];

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[70]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-medium">
              Изображение {activeIndex + 1} из {images.length}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center p-4">
        <img
          src={currentImage.url}
          alt={`Изображение ${activeIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: 'calc(80vh - 2rem)' }}
        />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="flex items-center justify-between">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex space-x-2 max-w-md overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === activeIndex
                      ? 'border-white'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`Миниатюра ${index + 1}`}
                    className="w-full h-full object-contain bg-gray-800"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onDelete(activeIndex);
                if (images.length === 1) {
                  onClose();
                } else if (activeIndex === images.length - 1) {
                  setActiveIndex(activeIndex - 1);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
