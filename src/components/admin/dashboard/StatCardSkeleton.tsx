'use client';

export default function StatCardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
        </div>
        <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}
