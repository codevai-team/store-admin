'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function AdminVerify() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 минут в секундах
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Устанавливаем фокус на первое поле при загрузке
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    // Таймер обратного отсчета
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/admin/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    // Если вставляется длинная строка (возможно, весь код)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newCode = ['', '', '', '', '', ''];
      
      // Заполняем все доступные позиции
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || '';
      }
      
      setCode(newCode);
      
      // Если заполнены все 6 цифр - автоматически отправляем
      if (digits.length >= 6) {
        setTimeout(() => {
          handleSubmit(newCode.join(''));
        }, 100);
      } else {
        // Фокусируемся на следующем пустом поле
        const nextEmptyIndex = Math.min(digits.length, 5);
        setTimeout(() => {
          inputRefs.current[nextEmptyIndex]?.focus();
        }, 10);
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Автоматическая отправка при заполнении всех полей
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      const newCode = ['', '', '', '', '', ''];
      
      // Заполняем все доступные позиции
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || '';
      }
      
      setCode(newCode);
      
      // Если заполнены все 6 цифр - автоматически отправляем
      if (digits.length >= 6) {
        setTimeout(() => {
          handleSubmit(newCode.join(''));
        }, 100);
      } else {
        // Фокусируемся на следующем пустом поле
        const nextEmptyIndex = Math.min(digits.length, 5);
        setTimeout(() => {
          inputRefs.current[nextEmptyIndex]?.focus();
        }, 10);
      }
    }
  };

  const handleSubmit = async (verificationCode?: string) => {
    const codeToSubmit = verificationCode || code.join('');
    
    if (codeToSubmit.length !== 6) {
      setError('Введите полный 6-значный код');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('Отправляем код на верификацию:', codeToSubmit);
      console.log('Токен:', token);
      
      const response = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          code: codeToSubmit
        }),
      });

      console.log('Статус ответа:', response.status);
      const data = await response.json();
      console.log('Данные ответа:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка верификации');
      }

      // Проверяем, успешна ли верификация
      if (data.success === false) {
        // Неверный код, но не критическая ошибка
        setError(data.message || 'Неверный код. Попробуйте еще раз.');
        // Очищаем поля для повторного ввода
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Успешная верификация - перенаправляем в дашборд
      console.log('Верификация успешна, перенаправляем на дашборд');
      
      // Даем время для установки куки, затем перенаправляем
      setTimeout(() => {
        console.log('Выполняем перенаправление через window.location.replace');
        window.location.replace('/admin/dashboard');
      }, 100);
    } catch (err) {
      console.error('Ошибка при верификации:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      // Очищаем поля при ошибке
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка отправки кода');
      }

      // Сбрасываем таймер
      setTimeLeft(300);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 lg:p-10 bg-gray-800 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 relative">
            <Image
              src="/logo-bugu.svg"
              alt="Bugu Store Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
            Двухфакторная аутентификация
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-400 px-2">
            Проверочный код отправлен в Telegram
          </p>
          <div className="mt-2 text-center text-xs sm:text-sm text-indigo-400 font-medium">
            Истекает через: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="mt-6 sm:mt-8 space-y-6">
          {/* Поля для кода - адаптивные размеры */}
          <div className="flex justify-center space-x-2 sm:space-x-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-center text-lg sm:text-xl lg:text-2xl font-bold bg-gray-700 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-white rounded-lg transition-all duration-200 touch-manipulation"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="bg-red-500/10 text-red-400 text-xs sm:text-sm p-3 rounded-lg text-center mx-2">
              {error}
            </div>
          )}

          {/* Кнопки - адаптивные отступы и размеры */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || code.some(digit => !digit)}
              className="w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white"
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
                'Подтвердить'
              )}
            </button>

            <button
              onClick={handleResendCode}
              disabled={isLoading || timeLeft > 240}
              className="w-full py-3 sm:py-4 px-4 text-xs sm:text-sm font-medium text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
            >
              {timeLeft > 240 ? 
                `Отправить повторно (${formatTime(timeLeft - 240)})` : 
                'Отправить код повторно'
              }
            </button>
          </div>
        </div>

        {/* Кнопка возврата */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full text-center text-xs sm:text-sm text-gray-400 hover:text-gray-300 transition-colors py-2 touch-manipulation"
          >
            ← Вернуться к входу
          </button>
        </div>
      </div>
    </div>
  );
}
