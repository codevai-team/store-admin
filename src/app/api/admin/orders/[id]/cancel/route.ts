import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { cancelComment } = await request.json();
    const { id: orderId } = await params;

    // Проверяем существование заказа и его текущий статус
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

    // Проверяем, что заказ можно отменить
    if (existingOrder.status !== 'CREATED' && existingOrder.status !== 'COURIER_WAIT') {
      return NextResponse.json(
        { error: 'Заказ можно отменить только в статусах "Создан" или "Ожидает курьера"' },
        { status: 400 }
      );
    }

    // Проверяем, что комментарий отмены предоставлен
    if (!cancelComment || !cancelComment.trim()) {
      return NextResponse.json(
        { error: 'Необходимо указать причину отмены заказа' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа и добавляем комментарий отмены
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELED',
        cancelComment: cancelComment.trim()
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Заказ успешно отменен'
    });

  } catch (error) {
    console.error('Error canceling order:', error);
    return NextResponse.json(
      { error: 'Ошибка отмены заказа' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
