'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuthToken } from '@/lib/auth';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Проверяем, есть ли токен в localStorage
        const token = getAuthToken();
        if (!token) {
          window.location.href = '/admin/login';
          return;
        }

        // Проверяем токен через API
        const response = await fetchWithAuth('/api/admin/verify-token');
        
        if (response.ok) {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/admin/login';
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        // В случае ошибки перенаправляем на страницу входа
        window.location.href = '/admin/login';
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
              src="/unimark-logo.svg"
              alt="Unimark Admin"
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