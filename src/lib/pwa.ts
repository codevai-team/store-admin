'use client';

// Интерфейс для события beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Расширяем Window интерфейс
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

// Регистрация service worker
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          // SW зарегистрирован успешно
        })
        .catch(() => {
          // Ошибка регистрации SW
        });
    });
  }
}

// Проверка поддержки PWA
export function isPWASupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Проверка, установлено ли приложение
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Проверяем display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Проверяем, запущено ли в полноэкранном режиме
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  // Проверяем localStorage
  return localStorage.getItem('pwa-installed') === 'true';
}

// Установка приложения
export async function installApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Проверяем, есть ли событие beforeinstallprompt
    const deferredPrompt = window.deferredPrompt;
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Ошибка при установке приложения:', error);
    return false;
  }
}

// Получение информации о PWA
export function getPWAInfo() {
  return {
    isSupported: isPWASupported(),
    isInstalled: isAppInstalled(),
    isOnline: navigator.onLine,
    userAgent: navigator.userAgent,
  };
}
