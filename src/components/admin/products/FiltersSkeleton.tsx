'use client';

export default function FiltersSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 animate-pulse">
      <div className="space-y-4">
        {/* Search and Sort Row */}
        <div className="flex flex-row gap-3">
          {/* Search Skeleton */}
          <div className="flex-1">
            <div className="h-10 bg-gray-700/50 rounded-lg"></div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden">
              <div className="w-10 h-10 bg-gray-700/50 rounded-lg"></div>
            </div>

            {/* Desktop Sort Controls */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="w-48 h-10 bg-gray-700/50 rounded-lg"></div>
              <div className="w-10 h-10 bg-gray-700/50 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Desktop Filters Row */}
        <div className="hidden lg:flex flex-col lg:flex-row gap-3">
          {/* Filter Skeletons */}
          <div className="flex-1">
            <div className="h-10 bg-gray-700/50 rounded-lg"></div>
          </div>
          <div className="flex-1">
            <div className="h-10 bg-gray-700/50 rounded-lg"></div>
          </div>
          <div className="flex-1">
            <div className="h-10 bg-gray-700/50 rounded-lg"></div>
          </div>
          <div className="flex-1">
            <div className="h-10 bg-gray-700/50 rounded-lg"></div>
          </div>
          <div className="flex-1">
            <div className="h-10 bg-gray-700/50 rounded-lg"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
