'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyChartWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  onVisible?: () => void;
}

export default function LazyChartWrapper({ 
  children, 
  fallback, 
  rootMargin = '100px',
  threshold = 0.1,
  onVisible
}: LazyChartWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          // Вызываем callback для загрузки данных с небольшой задержкой
          if (onVisible) {
            setTimeout(() => {
              onVisible();
            }, 100);
          }
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold, hasLoaded, onVisible]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <ChartSkeleton />)}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      
      {/* Chart area */}
      <div className="h-80 bg-gray-700/30 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-gray-400 text-sm">Загрузка графика...</div>
        </div>
      </div>
    </div>
  );
}
