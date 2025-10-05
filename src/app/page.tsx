'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { attemptAutoLogin } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Пытаемся выполнить автоматический вход
        const autoLoginSuccess = await attemptAutoLogin();
        
        if (autoLoginSuccess) {
          // Пользователь авторизован - перенаправляем на дашборд
          router.replace('/admin/dashboard');
          return;
        }

        // Пользователь не авторизован - перенаправляем на страницу входа
        router.replace('/admin/login');
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        // В случае ошибки перенаправляем на страницу входа
        router.replace('/admin/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Показываем загрузку во время проверки авторизации
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          {/* Логотип админ-панели */}
          <div className="mb-8">
            <Image
              src="/admin-store-logo.svg"
              alt="Store Admin"
              width={120}
              height={120}
              className="mx-auto"
              priority
            />
          </div>
          
          {/* Индикатор загрузки */}
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="text-gray-400 text-lg">Проверка авторизации...</p>
          </div>
        </div>
      </div>
    );
  }

  // Этот компонент не должен отображаться, так как всегда происходит перенаправление
  return null;
}