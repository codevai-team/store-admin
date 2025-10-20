'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        
        // Сначала проверяем, есть ли токен в localStorage
        const token = getAuthToken();
        if (!token) {
          window.location.href = '/admin/login';
          return;
        }

        // Проверяем токен через API
        const response = await fetchWithAuth('/api/admin/verify-token');
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          window.location.href = '/admin/login';
        }
      } catch (error) {
        console.error('AuthGuard: Ошибка проверки аутентификации:', error);
        window.location.href = '/admin/login';
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Перенаправление уже выполнено
  }

  return <>{children}</>;
}
