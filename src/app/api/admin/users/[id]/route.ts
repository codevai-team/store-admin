import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - получить сотрудника по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            shifts: true,
          },
        },
        shifts: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            _count: {
              select: {
                orders: true,
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении сотрудника' },
      { status: 500 }
    );
  }
}

// PUT - обновить сотрудника
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, phone, role } = body;

    // Валидация
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Имя и телефон обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Валидация телефона
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Неверный формат номера телефона' },
        { status: 400 }
      );
    }

    // Проверка на существование сотрудника
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    // Проверка на уникальность телефона (исключая текущего сотрудника)
    const userWithSamePhone = await prisma.user.findFirst({
      where: { 
        phone,
        id: { not: params.id },
      },
    });

    if (userWithSamePhone) {
      return NextResponse.json(
        { error: 'Сотрудник с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        role,
      },
      include: {
        _count: {
          select: {
            shifts: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении сотрудника' },
      { status: 500 }
    );
  }
}

// DELETE - удалить сотрудника
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка на существование сотрудника
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            shifts: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    // Проверка на связанные данные
    if (existingUser._count.shifts > 0) {
      return NextResponse.json(
        { error: 'Невозможно удалить сотрудника с активными сменами' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Сотрудник успешно удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении сотрудника' },
      { status: 500 }
    );
  }
}
