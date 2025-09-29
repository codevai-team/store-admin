import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminComment } = await request.json();
    const { id: orderId } = await params;

    // Проверяем существование заказа
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Проверяем, что заказ в статусе COURIER_WAIT
    if (existingOrder.status !== 'COURIER_WAIT') {
      return NextResponse.json(
        { error: 'Комментарий можно изменить только для заказов в статусе "Ожидает курьера"' },
        { status: 400 }
      );
    }

    // Обновляем комментарий админа
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        adminComment: adminComment || null
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Комментарий админа успешно обновлен'
    });

  } catch (error) {
    console.error('Error updating admin comment:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления комментария' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
