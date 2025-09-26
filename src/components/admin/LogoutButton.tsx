'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
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
