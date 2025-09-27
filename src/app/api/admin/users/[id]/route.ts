import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, ProductStatus, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - получить сотрудника по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: { 
        id,
        role: {
          in: [UserRole.SELLER, UserRole.COURIER]
        },
        status: {
          not: UserStatus.DELETED
        }
      },
      select: {
        id: true,
        fullname: true,
        phoneNumber: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: {
                status: ProductStatus.ACTIVE
              }
            },
            deliveredOrders: true,
          },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullname, phoneNumber, role, password, status } = body;

    // Валидация
    if (!fullname || !phoneNumber) {
      return NextResponse.json(
        { error: 'ФИО и телефон обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Валидация роли
    if (role && ![UserRole.SELLER, UserRole.COURIER].includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Недопустимая роль. Доступны: SELLER, COURIER' },
        { status: 400 }
      );
    }

    // Валидация статуса
    if (status && !['ACTIVE', 'INACTIVE', 'DELETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус. Доступны: ACTIVE, INACTIVE, DELETED' },
        { status: 400 }
      );
    }

    // Валидация телефона
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Неверный формат номера телефона' },
        { status: 400 }
      );
    }

    // Проверка на существование сотрудника
    const existingUser = await prisma.user.findUnique({
      where: { 
        id,
        role: {
          in: [UserRole.SELLER, UserRole.COURIER]
        }
      },
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
        phoneNumber,
        id: { not: id },
      },
    });

    if (userWithSamePhone) {
      return NextResponse.json(
        { error: 'Сотрудник с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    // Подготовка данных для обновления
    const updateData: any = {
      fullname,
      phoneNumber,
      role: role as UserRole,
    };

    // Добавляем статус если передан
    if (status) {
      updateData.status = UserStatus[status as keyof typeof UserStatus];
    }

    // Если передан новый пароль, хешируем его
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullname: true,
        phoneNumber: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: {
                status: ProductStatus.ACTIVE
              }
            },
            deliveredOrders: true,
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

// DELETE - мягкое удаление сотрудника (изменение статуса на DELETED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Проверка на существование сотрудника
    const existingUser = await prisma.user.findFirst({
      where: { 
        id,
        role: {
          in: [UserRole.SELLER, UserRole.COURIER]
        },
        status: {
          not: UserStatus.DELETED
        }
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    // Мягкое удаление - изменение статуса на DELETED
    await prisma.user.update({
      where: { id },
      data: { status: UserStatus.DELETED }
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