'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  UserIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import GlobalSearch from './GlobalSearch';

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [adminLogin, setAdminLogin] = useState<string>('admin');
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Загрузка логина администратора
  useEffect(() => {
    const fetchAdminLogin = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const settings = await response.json();
          if (settings.admin_login) {
            setAdminLogin(settings.admin_login);
          }
        }
      } catch (error) {
        console.error('Error fetching admin login:', error);
      }
    };

    fetchAdminLogin();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      router.push('/admin/login');
    }
  };

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 h-16 flex items-center justify-between px-4 lg:px-6 shadow-lg backdrop-blur-sm relative z-50">
      {/* Logo and Brand */}
      <div className="flex items-center flex-1">
        {/* Logo - скрывается при фокусе на мобильном поиске */}
        <div className={`w-9 h-9 relative sm:mr-4 transition-all duration-300 ${isMobileSearchFocused ? 'sm:block hidden' : ''}`}>
          <Image
            src="/admin-store-logo.svg"
            alt="Store"
            fill
            className="object-contain"
          />
        </div>
        
        {/* Brand text - только desktop */}
        <div className="hidden sm:block ml-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm">
            Store
          </h1>
          <div className="flex items-center space-x-1 -mt-1">
            <p className="text-xs text-indigo-300 font-medium">Admin Panel</p>
          </div>
        </div>
        
        {/* Search bar - Mobile (расширяется при фокусе) */}
        <div className={`sm:hidden transition-all duration-300 ${
          isMobileSearchFocused 
            ? 'flex-1 ml-2 mr-2' 
            : 'flex-1 ml-3 mr-3'
        }`}>
          <GlobalSearch 
            placeholder="Поиск..."
            isMobile={true}
            onFocusChange={setIsMobileSearchFocused}
          />
        </div>
        
        {/* Search bar - Desktop (до кнопки Online) */}
        <div className="ml-32 mr-8 hidden lg:block" style={{ width: 'calc(100vw - 780px)' }}>
          <GlobalSearch 
            placeholder="Поиск товаров, заказов, клиентов..."
            isMobile={false}
          />
        </div>
        
        {/* Search bar - Tablet (компактная версия) */}
        <div className="ml-6 mr-6 hidden sm:block lg:hidden" style={{ width: '280px' }}>
          <GlobalSearch 
            placeholder="Поиск..."
            isMobile={false}
          />
        </div>
      </div>

      {/* Right side - скрывается на мобильных при фокусе поиска */}
      <div className={`flex items-center space-x-3 transition-all duration-300 ${
        isMobileSearchFocused ? 'sm:flex hidden' : 'flex'
      }`}>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center space-x-4 mr-2">
          <div className="flex items-center space-x-2 bg-gray-800/60 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-300 font-medium">Online</span>
          </div>
        </div>
        

        {/* Settings */}
        <button 
          onClick={() => router.push('/admin/settings')}
          className="hidden sm:block relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/70 rounded-xl transition-all duration-200 group"
        >
          <Cog6ToothIcon className="h-5 w-5 group-hover:scale-110 group-hover:rotate-45 transition-all duration-200" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white bg-gray-700/60 hover:bg-gray-600/80 backdrop-blur-sm px-3 py-1 sm:py-2 rounded-xl text-sm font-medium transition-all duration-200 group border border-gray-600/30"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:block">Администратор</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl shadow-2xl bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 z-[70] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-b border-gray-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Администратор</div>
                      <div className="text-xs text-gray-400">{adminLogin}</div>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  {/* Статистика - только на мобильных устройствах */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/admin/statistics');
                    }}
                    className="sm:hidden flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200 group"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-3 text-orange-400 group-hover:text-orange-300 transition-colors duration-200" />
                    <span>Статистика</span>
                  </button>
                  
                  {/* Настройки - только на мобильных устройствах */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/admin/settings');
                    }}
                    className="sm:hidden flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200 group"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-indigo-400 transition-colors duration-200" />
                    <span>Настройки</span>
                  </button>
                  
                  {/* Разделитель - только если есть настройки на мобильных */}
                  <div className="sm:hidden border-t border-gray-600/30 my-2"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 group"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-300 transition-colors duration-200" />
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
    </header>
  );
}
