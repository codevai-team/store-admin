'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa';

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Регистрируем service worker при загрузке приложения
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
