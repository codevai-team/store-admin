import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить филиал по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            shifts: true,
            orders: true,
          },
        },
        shifts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Филиал не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении филиала' },
      { status: 500 }
    );
  }
}

// PUT - обновить филиал
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, address, phone, location, isActive } = body;

    // Валидация
    if (!name || !address || !phone || !location) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверка на существование филиала
    const existingStore = await prisma.store.findUnique({
      where: { id: params.id },
    });

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Филиал не найден' },
        { status: 404 }
      );
    }

    // Проверка на уникальность телефона (исключая текущий филиал)
    const storeWithSamePhone = await prisma.store.findFirst({
      where: { 
        phone,
        id: { not: params.id },
      },
    });

    if (storeWithSamePhone) {
      return NextResponse.json(
        { error: 'Филиал с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    const store = await prisma.store.update({
      where: { id: params.id },
      data: {
        name,
        address,
        phone,
        location,
        isActive,
      },
      include: {
        _count: {
          select: {
            shifts: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(store);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении филиала' },
      { status: 500 }
    );
  }
}

// DELETE - удалить филиал
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка на существование филиала
    const existingStore = await prisma.store.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            shifts: true,
            orders: true,
          },
        },
      },
    });

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Филиал не найден' },
        { status: 404 }
      );
    }

    // Проверка на связанные данные
    if (existingStore._count.shifts > 0) {
      return NextResponse.json(
        { error: 'Невозможно удалить филиал с активными сменами' },
        { status: 400 }
      );
    }

    if (existingStore._count.orders > 0) {
      return NextResponse.json(
        { error: 'Невозможно удалить филиал с заказами' },
        { status: 400 }
      );
    }

    await prisma.store.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Филиал успешно удален' });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении филиала' },
      { status: 500 }
    );
  }
}
