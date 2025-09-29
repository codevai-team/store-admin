import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminComment } = await request.json();
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

    // Проверяем, что заказ в статусе CREATED
    if (existingOrder.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Заказ можно передать курьерам только в статусе "Создан"' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа и добавляем комментарий админа
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COURIER_WAIT',
        ...(adminComment && { adminComment })
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Заказ успешно передан курьерам'
    });

  } catch (error) {
    console.error('Error transferring order to courier:', error);
    return NextResponse.json(
      { error: 'Ошибка передачи заказа курьерам' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
