'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Проверяем, установлено ли приложение
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Проверяем, есть ли в localStorage флаг установки
      const installed = localStorage.getItem('pwa-installed');
      if (installed === 'true') {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Слушаем событие appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      
      // Установка завершена
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Ошибка при установке PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Не показываем снова в течение 7 дней
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Не показываем, если уже установлено или недавно отклонено
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  // Проверяем, не отклоняли ли недавно
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedTime < sevenDays) {
      return null;
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Установить приложение
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Добавьте Unimark Admin на главный экран для быстрого доступа
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
              >
                Установить
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-medium py-2 px-3 rounded-md transition-colors"
              >
                Позже
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
