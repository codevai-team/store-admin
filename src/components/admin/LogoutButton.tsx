'use client';

import { useRouter } from 'next/navigation';
import { removeAuthToken } from '@/lib/auth';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Удаляем токен из localStorage
      removeAuthToken();
      
      // Удаляем куки через API
      await fetch('/api/admin/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      // В любом случае перенаправляем на страницу входа
      router.push('/admin/login');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      Выйти
    </button>
  );
}
