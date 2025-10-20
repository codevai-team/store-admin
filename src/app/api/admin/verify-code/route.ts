import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { verificationCodes } from '@/lib/verification-codes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, code } = body;
    
    // Обрабатываем запрос на верификацию кода

    if (!token || !code) {
      return NextResponse.json(
        { message: 'Токен и код обязательны' },
        { status: 400 }
      );
    }

    // Проверяем токен
    let decoded;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      decoded = payload;
    } catch {
      return NextResponse.json(
        { message: 'Недействительный токен' },
        { status: 401 }
      );
    }

    if (decoded.stage !== 'pending_verification') {
      return NextResponse.json(
        { message: 'Неверный этап аутентификации' },
        { status: 400 }
      );
    }

    // Очищаем старые коды
    verificationCodes.cleanup();
    
    // Проверяем сохраненный код
    
    // Проверяем код
    const storedCodeData = verificationCodes.get(decoded.login as string);
    
    if (!storedCodeData) {
      return NextResponse.json(
        { message: 'Код не найден или истек' },
        { status: 400 }
      );
    }

    // Проверяем, не истек ли код (5 минут)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - storedCodeData.timestamp > fiveMinutes) {
      verificationCodes.delete(decoded.login as string);
      return NextResponse.json(
        { message: 'Код истек' },
        { status: 400 }
      );
    }

    // Сравниваем код
    
    if (storedCodeData.code !== code.trim()) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Неверный код. Попробуйте еще раз.' 
        },
        { status: 200 } // Возвращаем 200 вместо 400
      );
    }

    // Код верный, создаем финальный токен

    // Удаляем использованный код
    verificationCodes.delete(decoded.login as string);

    // Создаем финальный JWT токен для полной аутентификации
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const finalToken = await new SignJWT({ 
      login: decoded.login,
      stage: 'authenticated',
      timestamp: Date.now()
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(secret);

    // Устанавливаем куки с токеном

    // Устанавливаем куки с финальным токеном
    const response = NextResponse.json(
      { 
        success: true,
        message: 'Аутентификация завершена успешно',
        token: finalToken // Возвращаем токен для сохранения в localStorage
      },
      { status: 200 }
    );
    
    response.cookies.set('admin_token', finalToken, {
      httpOnly: false, // Позволяем JavaScript читать cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 день
    });

    return response;

  } catch (error) {
    console.error('Ошибка верификации кода:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
