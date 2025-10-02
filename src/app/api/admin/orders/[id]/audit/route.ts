import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить историю изменений заказа
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем существование заказа
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Получаем историю изменений (если таблица существует)
    // Пока что возвращаем пустой массив, так как модель orderAudit не определена
    const audits: Array<{
      id: string;
      orderId: string;
      action: string;
      oldValue?: string;
      newValue?: string;
      createdAt: Date;
      userId?: string;
    }> = [];

    // Преобразуем данные для фронтенда
    const transformedAudits = audits.map((audit) => ({
      ...audit,
      createdAt: audit.createdAt ? audit.createdAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json({
      orderId: order.id,
      audits: transformedAudits
    });
  } catch (error) {
    console.error('Order audit GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения истории изменений', details: (error as Error)?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
