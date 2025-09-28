import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - получить все настройки
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true
      }
    });

    // Преобразуем в объект для удобства использования
    const settingsObject: Record<string, string> = {};
    settings.forEach(setting => {
      // Не отдаем пароль в открытом виде
      if (setting.key !== 'admin_password') {
        settingsObject[setting.key] = setting.value;
      }
    });

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - обновить настройки
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, currentPassword, newLogin, newPassword, telegramBotToken, telegramChatId } = body;

    if (type === 'verify_password') {
      // Проверяем текущий пароль
      const currentPasswordSetting = await prisma.setting.findUnique({
        where: { key: 'admin_password' }
      });

      if (!currentPasswordSetting) {
        return NextResponse.json(
          { error: 'Current password not found' },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(currentPassword, currentPasswordSetting.value);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid current password' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: 'Password verified' });
    }

    if (type === 'auth') {
      // Обновляем логин и пароль (пароль уже проверен на предыдущем этапе)
      const updates = [];
      
      if (newLogin && newLogin.trim()) {
        updates.push(
          prisma.setting.upsert({
            where: { key: 'admin_login' },
            update: { value: newLogin.trim() },
            create: { key: 'admin_login', value: newLogin.trim() }
          })
        );
      }

      if (newPassword && newPassword.trim()) {
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 12);
        updates.push(
          prisma.setting.upsert({
            where: { key: 'admin_password' },
            update: { value: hashedPassword },
            create: { key: 'admin_password', value: hashedPassword }
          })
        );
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: 'No changes provided' },
          { status: 400 }
        );
      }

      await Promise.all(updates);

      return NextResponse.json({ success: true, message: 'Auth settings updated successfully' });
    }

    if (type === 'telegram') {
      // Обновляем настройки Telegram
      const updates = [];

      if (telegramBotToken !== undefined) {
        updates.push(
          prisma.setting.upsert({
            where: { key: 'TELEGRAM_BOT_TOKEN' },
            update: { value: telegramBotToken },
            create: { key: 'TELEGRAM_BOT_TOKEN', value: telegramBotToken }
          })
        );
      }

      if (telegramChatId !== undefined) {
        updates.push(
          prisma.setting.upsert({
            where: { key: 'TELEGRAM_CHAT_ID' },
            update: { value: telegramChatId },
            create: { key: 'TELEGRAM_CHAT_ID', value: telegramChatId }
          })
        );
      }

      await Promise.all(updates);

      return NextResponse.json({ success: true, message: 'Telegram settings updated successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid update type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
