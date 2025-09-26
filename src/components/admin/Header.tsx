'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BellIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();

  // Закрытие меню при клике вне его области
  const handleClickOutside = () => {
    setIsProfileMenuOpen(false);
  };

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
      <div className="flex items-center">
        {/* Logo */}
        <div className="w-9 h-9 relative sm:mr-4">
          <Image
            src="/logo-bugu.svg"
            alt="Bugu Store"
            fill
            className="object-contain"
          />
        </div>
        
        {/* Brand text - только desktop */}
        <div className="hidden sm:block ml-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm">
            Bugu Store
          </h1>
          <div className="flex items-center space-x-1 -mt-1">
            <p className="text-xs text-indigo-300 font-medium">Admin Panel</p>
          </div>
        </div>
        
        {/* Search bar - Mobile (сразу после логотипа) */}
        <div className="flex-1 ml-3 mr-3 sm:hidden">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-400 transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder="Поиск..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-600/50 rounded-lg leading-5 bg-gray-800/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:bg-gray-700/70 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 backdrop-blur-sm"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Search bar - Desktop (до кнопки Online) */}
        <div className="ml-8 mr-8 hidden lg:block" style={{ width: 'calc(100vw - 780px)' }}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder="Поиск товаров, заказов, клиентов..."
              className="block w-full pl-12 pr-4 py-2.5 border border-gray-600/50 rounded-xl leading-5 bg-gray-800/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:bg-gray-700/70 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 backdrop-blur-sm"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Search bar - Tablet (компактная версия) */}
        <div className="ml-6 mr-6 hidden sm:block lg:hidden">
          <div className="relative group" style={{ width: '280px' }}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-400 transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder="Поиск..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-600/50 rounded-lg leading-5 bg-gray-800/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:bg-gray-700/70 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 backdrop-blur-sm"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center space-x-4 mr-2">
          <div className="flex items-center space-x-2 bg-gray-800/60 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-300 font-medium">Online</span>
          </div>
        </div>
        
        {/* Notifications */}
        <button className="relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/70 rounded-xl transition-all duration-200 group">
          <BellIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
              <span className="text-[10px] font-bold text-white">3</span>
            </span>
          </span>
        </button>

        {/* Settings */}
        <button className="hidden sm:block relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/70 rounded-xl transition-all duration-200 group">
          <Cog6ToothIcon className="h-5 w-5 group-hover:scale-110 group-hover:rotate-45 transition-all duration-200" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white bg-gray-700/60 hover:bg-gray-600/80 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group border border-gray-600/30"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:block">Администратор</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[60]"
                onClick={handleClickOutside}
              />
              <div className="absolute right-0 mt-3 w-56 rounded-xl shadow-2xl bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 z-[70] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-b border-gray-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Администратор</div>
                      <div className="text-xs text-gray-400">bugu_admin</div>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      // TODO: Добавить страницу профиля
                    }}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200 group"
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-indigo-400 transition-colors duration-200" />
                    <span>Профиль</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      // TODO: Добавить страницу настроек
                    }}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200 group"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-indigo-400 transition-colors duration-200" />
                    <span>Настройки</span>
                  </button>
                  
                  <div className="border-t border-gray-600/30 my-2"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 group"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-300 transition-colors duration-200" />
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
