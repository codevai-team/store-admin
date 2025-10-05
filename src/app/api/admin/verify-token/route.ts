import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
  try {
    let token: string | null = null;

    // Сначала пытаемся получить токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Если токен не найден в заголовке, пытаемся получить из cookies
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const tokenCookie = cookieHeader
          .split(';')
          .find(cookie => cookie.trim().startsWith('admin_token='));

        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { message: 'Токен не найден' },
        { status: 401 }
      );
    }

    // Проверяем валидность токена
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);

      // Проверяем, что пользователь полностью аутентифицирован
      if (payload.stage !== 'authenticated') {
        return NextResponse.json(
          { message: 'Токен не содержит полной аутентификации' },
          { status: 401 }
        );
      }

      // Токен валидный
      return NextResponse.json(
        { 
          success: true,
          message: 'Токен валидный',
          user: {
            login: payload.login,
            timestamp: payload.timestamp
          }
        },
        { status: 200 }
      );
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        { message: 'Недействительный токен' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { message: 'Ошибка проверки токена' },
      { status: 500 }
    );
  }
}

