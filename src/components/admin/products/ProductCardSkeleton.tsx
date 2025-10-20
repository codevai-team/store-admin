'use client';

export default function ProductCardSkeleton() {
  return (
    <div className="flex items-start sm:items-center justify-between gap-3 rounded-lg p-4 border border-gray-700/50 animate-pulse">
      <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
        {/* Product Image Skeleton */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-700/50 rounded-lg"></div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            {/* Product Name Skeleton */}
            <div className="h-5 bg-gray-700 rounded w-48 mb-1"></div>
            
            <div className="flex items-center space-x-2">
              {/* Category Tag Skeleton */}
              <div className="h-6 bg-gray-700 rounded w-20"></div>
              {/* Status Tag Skeleton */}
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-1">
            {/* Price Skeleton */}
            <div className="flex items-center space-x-1">
              <div className="h-4 w-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>

            {/* Seller Skeleton */}
            <div className="flex items-center space-x-1">
              <div className="h-4 w-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
            
            {/* Sizes Skeleton */}
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-700 rounded w-12"></div>
              <div className="flex gap-1">
                <div className="h-6 bg-gray-700 rounded w-8"></div>
                <div className="h-6 bg-gray-700 rounded w-8"></div>
                <div className="h-6 bg-gray-700 rounded w-8"></div>
              </div>
            </div>
            
            {/* Colors Skeleton */}
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-700 rounded w-10"></div>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
              </div>
            </div>
            
            {/* Date Skeleton */}
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

// Компонент для мобильной версии
export function MobileProductCardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 animate-pulse">
      <div className="flex items-start space-x-3">
        {/* Image Skeleton */}
        <div className="flex-shrink-0 w-20 h-20 bg-gray-700/50 rounded-lg"></div>
        
        <div className="flex-1 min-w-0">
          {/* Title Skeleton */}
          <div className="h-5 bg-gray-700 rounded w-full mb-2"></div>
          
          {/* Price Skeleton */}
          <div className="h-6 bg-gray-700 rounded w-24 mb-2"></div>
          
          {/* Category and Status Skeleton */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-5 bg-gray-700 rounded w-16"></div>
            <div className="h-5 bg-gray-700 rounded w-14"></div>
          </div>
          
          {/* Seller Skeleton */}
          <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
          
          {/* Sizes and Colors Skeleton */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="h-4 bg-gray-700 rounded w-12"></div>
              <div className="flex gap-1">
                <div className="h-5 bg-gray-700 rounded w-6"></div>
                <div className="h-5 bg-gray-700 rounded w-6"></div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-4 bg-gray-700 rounded w-10"></div>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Button Skeleton */}
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}
