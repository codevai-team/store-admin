'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header - во всю ширину экрана */}
      <Header />
      
      {/* Content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-900 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Bottom Navigation - только для мобильных */}
      <BottomNavigation />
    </div>
  );
}
