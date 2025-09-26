import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { verificationCodes } from '@/lib/verification-codes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, code } = body;
    
    console.log('Получен запрос на верификацию кода:', { token: token ? 'есть' : 'нет', code });

    if (!token || !code) {
      console.log('Отсутствует токен или код');
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
    } catch (error) {
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
    
    // Для отладки: показываем все коды
    console.log('Все коды в хранилище при верификации:', verificationCodes.getAllCodes());
    
    // Проверяем код
    const storedCodeData = verificationCodes.get(decoded.login as string);
    console.log('Сохраненный код для пользователя:', decoded.login, storedCodeData);
    
    if (!storedCodeData) {
      console.log('Код не найден для пользователя:', decoded.login);
      console.log('Доступные коды:', verificationCodes.getAllCodes());
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
    console.log('Сравниваем коды:', { введенный: code.trim(), сохраненный: storedCodeData.code });
    
    if (storedCodeData.code !== code.trim()) {
      console.log('Коды не совпадают');
      return NextResponse.json(
        { 
          success: false,
          message: 'Неверный код. Попробуйте еще раз.' 
        },
        { status: 200 } // Возвращаем 200 вместо 400
      );
    }

    console.log('Код верный, создаем финальный токен');

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

    console.log('Финальный токен создан, устанавливаем куки');

    // Устанавливаем куки с финальным токеном
    const response = NextResponse.json(
      { 
        success: true,
        message: 'Аутентификация завершена успешно' 
      },
      { status: 200 }
    );
    
    response.cookies.set('admin_token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 день
    });

    console.log('Куки установлены, возвращаем успешный ответ');
    return response;

  } catch (error) {
    console.error('Ошибка верификации кода:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
