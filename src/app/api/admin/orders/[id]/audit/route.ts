import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить историю изменений заказа
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Проверяем существование заказа
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Получаем историю изменений
    const audits = await prisma.orderAudit.findMany({
      where: { orderId: id },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Преобразуем данные для фронтенда
    const transformedAudits = audits.map(audit => ({
      ...audit,
      createdAt: audit.createdAt.toISOString()
    }));

    return NextResponse.json({
      orderNumber: order.orderNumber,
      audits: transformedAudits
    });
  } catch (error) {
    console.error('Order audit GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения истории изменений', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
