/**
 * Утилиты для работы с аутентификацией в PWA
 * Поддерживает как localStorage, так и cookies для максимальной совместимости
 */

const AUTH_TOKEN_KEY = 'admin_auth_token';

export interface AuthToken {
  token: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Сохраняет токен аутентификации в localStorage
 */
export function saveAuthToken(token: string, expiresInHours: number = 24): void {
  try {
    const authData: AuthToken = {
      token,
      timestamp: Date.now(),
      expiresAt: Date.now() + (expiresInHours * 60 * 60 * 1000)
    };
    
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(authData));
    console.log('Токен сохранен в localStorage');
  } catch (error) {
    console.error('Ошибка сохранения токена в localStorage:', error);
  }
}

/**
 * Получает токен аутентификации из localStorage
 */
export function getAuthToken(): string | null {
  try {
    const authDataStr = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!authDataStr) {
      return null;
    }

    const authData: AuthToken = JSON.parse(authDataStr);
    
    // Проверяем, не истек ли токен
    if (Date.now() > authData.expiresAt) {
      console.log('Токен истек, удаляем из localStorage');
      removeAuthToken();
      return null;
    }

    return authData.token;
  } catch (error) {
    console.error('Ошибка получения токена из localStorage:', error);
    removeAuthToken();
    return null;
  }
}

/**
 * Удаляет токен аутентификации из localStorage
 */
export function removeAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log('Токен удален из localStorage');
  } catch (error) {
    console.error('Ошибка удаления токена из localStorage:', error);
  }
}

/**
 * Проверяет, есть ли валидный токен в localStorage
 */
export function hasValidToken(): boolean {
  return getAuthToken() !== null;
}

/**
 * Получает токен из cookies (fallback)
 */
export function getTokenFromCookies(): string | null {
  try {
    const token = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('admin_token='));
    
    if (token) {
      return token.split('=')[1];
    }
    return null;
  } catch (error) {
    console.error('Ошибка получения токена из cookies:', error);
    return null;
  }
}

/**
 * Проверяет валидность токена через API
 */
export async function verifyTokenWithAPI(token?: string): Promise<boolean> {
  try {
    const tokenToVerify = token || getAuthToken() || getTokenFromCookies();
    if (!tokenToVerify) {
      return false;
    }

    const response = await fetch('/api/admin/verify-token', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenToVerify}`
      },
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Ошибка проверки токена через API:', error);
    return false;
  }
}

/**
 * Выполняет автоматический вход если есть валидный токен
 * Проверяет сначала localStorage, потом cookies
 */
export async function attemptAutoLogin(): Promise<boolean> {
  try {
    // Сначала проверяем localStorage
    let token = getAuthToken();
    
    if (token) {
      console.log('Найден токен в localStorage, проверяем...');
      const isValid = await verifyTokenWithAPI(token);
      if (isValid) {
        console.log('Автоматический вход выполнен успешно (localStorage)');
        return true;
      } else {
        console.log('Токен из localStorage недействителен, удаляем');
        removeAuthToken();
      }
    }

    // Если localStorage пуст, проверяем cookies
    token = getTokenFromCookies();
    if (token) {
      console.log('Найден токен в cookies, проверяем...');
      const isValid = await verifyTokenWithAPI(token);
      if (isValid) {
        console.log('Автоматический вход выполнен успешно (cookies)');
        // Сохраняем токен в localStorage для будущих использований
        saveAuthToken(token, 24);
        return true;
      }
    }

    console.log('Автоматический вход не удался');
    return false;
  } catch (error) {
    console.error('Ошибка автоматического входа:', error);
    removeAuthToken();
    return false;
  }
}
