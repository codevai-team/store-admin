/**
 * Утилита для добавления токена аутентификации в заголовки запросов
 */

import { getAuthToken } from './auth';

/**
 * Создает заголовки с токеном аутентификации
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Выполняет fetch запрос с автоматическим добавлением токена
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Добавляем токен аутентификации
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Устанавливаем Content-Type если не указан
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Включаем cookies для совместимости
  });
}
