import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { verificationCodes } from '@/lib/verification-codes';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Токен авторизации не предоставлен' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
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

    // Получаем настройки Telegram из базы данных
    const [botTokenSetting, chatIdSetting] = await Promise.all([
      prisma.setting.findUnique({
        where: { key: 'TELEGRAM_BOT_TOKEN' },
      }),
      prisma.setting.findUnique({
        where: { key: 'TELEGRAM_CHAT_ID' },
      }),
    ]);

    if (!botTokenSetting || !chatIdSetting) {
      return NextResponse.json(
        { message: 'Telegram не настроен' },
        { status: 500 }
      );
    }

    // Генерируем 6-значный код
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Очищаем старые коды
    verificationCodes.cleanup();
    
    // Сохраняем код с временной меткой
    verificationCodes.set(decoded.login as string, {
      code: verificationCode,
      timestamp: Date.now()
    });
    
    // Для отладки: показываем все коды
    console.log('Все коды в хранилище:', verificationCodes.getAllCodes());

    // Отправляем код через Telegram
    const telegramMessage = `🔐 *Код подтверждения входа*
    
*Bugu Store Admin Panel*

Ваш код для завершения входа в систему:

\`${verificationCode}\`

📋 *Нажмите на код для копирования*

⏰ Код действителен: *5 минут*
🔒 Никому не сообщайте этот код

⚠️ *Если это не вы*, проигнорируйте это сообщение и смените пароль администратора.`;
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botTokenSetting.value}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatIdSetting.value,
        text: telegramMessage,
        parse_mode: 'Markdown'
      }),
    });

    if (!telegramResponse.ok) {
      const telegramError = await telegramResponse.json();
      console.error('Ошибка отправки сообщения в Telegram:', telegramError);
      return NextResponse.json(
        { message: 'Ошибка отправки кода в Telegram' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Код отправлен в Telegram'
    });

  } catch (error) {
    console.error('Ошибка отправки кода:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Экспортируем функцию для использования в верификации
export { verificationCodes };