import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { courierId } = await request.json();
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

    // Проверяем, что заказ в статусе COURIER_PICKED
    if (existingOrder.status !== 'COURIER_PICKED') {
      return NextResponse.json(
        { error: 'Курьера можно изменить только для заказов в статусе "Курьер принял"' },
        { status: 400 }
      );
    }

    // Если указан courierId, проверяем существование курьера
    if (courierId) {
      const courier = await prisma.user.findUnique({
        where: { 
          id: courierId,
          role: 'COURIER',
          status: 'ACTIVE'
        }
      });

      if (!courier) {
        return NextResponse.json(
          { error: 'Курьер не найден или неактивен' },
          { status: 400 }
        );
      }
    }

    // Обновляем курьера заказа
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        courierId: courierId || null
      },
      include: {
        courier: {
          select: {
            id: true,
            fullname: true,
            phoneNumber: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: courierId ? 'Курьер успешно назначен' : 'Курьер успешно удален'
    });

  } catch (error) {
    console.error('Error updating order courier:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления курьера' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
