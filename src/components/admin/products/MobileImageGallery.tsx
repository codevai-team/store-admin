'use client';

import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface MobileImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export default function MobileImageGallery({
  images,
  productName,
  className = ''
}: MobileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={`h-52 bg-gray-700/30 rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center">
          <PhotoIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Нет изображений</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Main Gallery */}
      <div className={`relative ${className}`}>
        {/* Main Image */}
        <div 
          className="h-52 bg-gray-700/30 rounded-xl overflow-hidden relative cursor-pointer group"
          onClick={() => setIsFullscreen(true)}
        >
          <img 
            src={images[currentIndex]} 
            alt={`${productName} - изображение ${currentIndex + 1}`}
            className="w-full h-full object-contain bg-gray-800 group-hover:scale-105 transition-transform duration-200"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <PhotoIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        
         {/* Thumbnail Navigation */}
         {images.length > 1 && (
           <div className="mt-3">
             <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
               {images.map((image, index) => (
                 <button
                   key={index}
                   onClick={() => setCurrentIndex(index)}
                   className={`flex-shrink-0 w-10 h-10 bg-gray-600/30 rounded-md overflow-hidden transition-all duration-200 relative ${
                     index === currentIndex 
                       ? 'scale-105' 
                       : 'hover:bg-gray-600/50 hover:scale-105'
                   }`}
                 >
                   <img 
                     src={image} 
                     alt={`${productName} - миниатюра ${index + 1}`}
                     className="w-full h-full object-cover"
                   />
                   {index === currentIndex && (
                     <div className="absolute inset-0 border-2 border-indigo-500 rounded-md pointer-events-none"></div>
                   )}
                 </button>
               ))}
             </div>
           </div>
         )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[10000] bg-black">
          <div className="relative h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Image */}
            <img 
              src={images[currentIndex]} 
              alt={`${productName} - изображение ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
