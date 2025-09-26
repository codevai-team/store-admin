import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, password } = body;

    // Получаем данные для входа из настроек
    const [loginSetting, passwordSetting] = await Promise.all([
      prisma.setting.findUnique({
        where: { key: 'admin_login' },
      }),
      prisma.setting.findUnique({
        where: { key: 'admin_password' },
      }),
    ]);

    if (!loginSetting || !passwordSetting) {
      return NextResponse.json(
        { message: 'Ошибка конфигурации админ-доступа' },
        { status: 500 }
      );
    }

    // Проверяем логин
    if (login !== loginSetting.value) {
      return NextResponse.json(
        { message: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, passwordSetting.value);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    // Создаем временный JWT токен для первого этапа аутентификации
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const tempToken = await new SignJWT({ 
      login: loginSetting.value,
      stage: 'pending_verification',
      timestamp: Date.now()
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(secret);

    return NextResponse.json(
      { 
        success: true,
        token: tempToken,
        message: 'Первый этап аутентификации пройден' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}