import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
  try {
    // Извлекаем токен из cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { message: 'Токен не найден' },
        { status: 401 }
      );
    }

    const tokenCookie = cookieHeader
      .split(';')
      .find(cookie => cookie.trim().startsWith('admin_token='));

    if (!tokenCookie) {
      return NextResponse.json(
        { message: 'Токен не найден' },
        { status: 401 }
      );
    }

    const token = tokenCookie.split('=')[1];

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
