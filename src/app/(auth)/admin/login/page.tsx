'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function AdminLogin() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Первый этап: аутентификация
      const authResponse = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.message || 'Ошибка аутентификации');
      }

      if (!authData.success || !authData.token) {
        throw new Error('Неверный ответ от сервера');
      }

      // Сохраняем токен
      const token = authData.token;

      // Второй этап: запрос кода верификации
      const codeResponse = await fetch('/api/admin/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const codeData = await codeResponse.json();

      if (!codeResponse.ok) {
        throw new Error(codeData.message || 'Ошибка отправки кода');
      }

      // Если все успешно, перенаправляем на страницу верификации
      router.push(`/admin/verify?token=${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 lg:p-10 bg-gray-800 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 relative">
            <Image
              src="/logo-bugu.svg"
              alt="Bugu Store Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
            Вход в админ-панель
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-400 px-2">
            Введите учетные данные для доступа
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="login" className="sr-only">
                Логин
              </label>
              <div className="relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  className="block w-full px-4 py-3 sm:py-4 text-sm sm:text-base rounded-lg bg-gray-700 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 transition-all duration-200 touch-manipulation"
                  placeholder="Логин"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-4 py-3 sm:py-4 text-sm sm:text-base rounded-lg bg-gray-700 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 pr-12 transition-all duration-200 touch-manipulation"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 focus:outline-none touch-manipulation"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 text-xs sm:text-sm p-3 rounded-lg text-center mx-2">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out touch-manipulation"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 sm:h-6 sm:w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Войти"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">
                Bugu Store Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}