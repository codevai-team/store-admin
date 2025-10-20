import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Проверяем, является ли запрос к админ-панели
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    let token = request.cookies.get('admin_token');
    
    // Если токен не найден в cookies, пытаемся получить из заголовка Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenValue = authHeader.substring(7);
        // Создаем временный объект cookie для совместимости
        token = { name: 'admin_token', value: tokenValue };
      }
    }
    
    // Проверяем токен

    // Если токен есть, проверяем его валидность
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
        const { payload } = await jwtVerify(token.value, secret);
        
        // Если пользователь аутентифицирован
        if (payload.stage === 'authenticated') {
          // Если он пытается зайти на страницы логина или просто /admin - перенаправляем на дашборд
          if (request.nextUrl.pathname === '/admin/login' || 
              request.nextUrl.pathname === '/admin' ||
              request.nextUrl.pathname === '/admin/') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          }
          
          // Для всех остальных админ страниц - разрешаем доступ
          return NextResponse.next();
        }
      } catch {
        // Токен недействителен, удаляем его и перенаправляем на логин
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('admin_token');
        return response;
      }
    }
    
    // Если токена нет или он недействителен
    // Пропускаем страницы аутентификации
    if (request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname === '/admin/verify') {
      return NextResponse.next();
    }

    // Для всех остальных админ страниц требуем аутентификацию
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [], // Отключаем middleware для админ страниц
};
