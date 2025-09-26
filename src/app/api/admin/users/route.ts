import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - получить список сотрудников
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;

    // Построение условий поиска
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Получение сотрудников с пагинацией
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
                },
              },
            },
            orderBy: {
              startedAt: 'desc',
            },
            take: 1,
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении сотрудников' },
      { status: 500 }
    );
  }
}

// POST - создать нового сотрудника
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, role = 'MANAGER' } = body;

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

    // Проверка на уникальность телефона
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Сотрудник с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сотрудника' },
      { status: 500 }
    );
  }
}
