import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Проверяем, является ли запрос к админ-панели
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware: Проверка пути:', request.nextUrl.pathname);
    
    const token = request.cookies.get('admin_token');
    console.log('Middleware: Токен найден:', !!token);

    // Если токен есть, проверяем его валидность
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
        const { payload } = await jwtVerify(token.value, secret);
        console.log('Middleware: Токен декодирован, стадия:', payload.stage);
        
        // Если пользователь аутентифицирован
        if (payload.stage === 'authenticated') {
          // Если он пытается зайти на страницы логина или просто /admin - перенаправляем на дашборд
          if (request.nextUrl.pathname === '/admin/login' || 
              request.nextUrl.pathname === '/admin' ||
              request.nextUrl.pathname === '/admin/') {
            console.log('Middleware: Аутентифицированный пользователь на странице логина, перенаправляем на дашборд');
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          }
          
          // Для всех остальных админ страниц - разрешаем доступ
          console.log('Middleware: Токен валидный, разрешаем доступ');
          return NextResponse.next();
        }
      } catch (error) {
        console.log('Middleware: Ошибка проверки токена:', error);
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
      console.log('Middleware: Пропускаем страницу аутентификации');
      return NextResponse.next();
    }

    // Для всех остальных админ страниц требуем аутентификацию
    console.log('Middleware: Токен отсутствует или недействителен, перенаправляем на логин');
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
