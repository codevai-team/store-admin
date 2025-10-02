import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, ProductStatus, UserStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - получить список сотрудников (продавцов и курьеров)
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

    // Построение условий поиска - только продавцы и курьеры
    const where: Prisma.UserWhereInput = {
      role: {
        in: [UserRole.SELLER, UserRole.COURIER]
      }
    };

    // Фильтрация по статусу
    const statusFilter = searchParams.get('status');
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'DELETED') {
        where.status = UserStatus.DELETED;
      } else if (statusFilter === 'ACTIVE') {
        where.status = UserStatus.ACTIVE;
      } else if (statusFilter === 'INACTIVE') {
        where.status = UserStatus.INACTIVE;
      }
    } else if (!statusFilter || statusFilter === 'ALL') {
      // По умолчанию исключаем удаленных, если не выбран "Все статусы"
      if (!statusFilter) {
        where.status = {
          not: UserStatus.DELETED
        };
      }
      // Если выбран "ALL", не добавляем фильтр по статусу
    }
    
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && ['SELLER', 'COURIER'].includes(role)) {
      where.role = role as UserRole;
    }

    // Построение orderBy в зависимости от сортировки
    let orderBy: Record<string, string | { _count: string }> = { [sortBy]: sortOrder };
    
    if (sortBy === 'productsCount') {
      orderBy = {
        products: {
          _count: sortOrder
        }
      };
    } else if (sortBy === 'deliveredOrdersCount') {
      orderBy = {
        deliveredOrders: {
          _count: sortOrder
        }
      };
    }

    // Получение сотрудников с пагинацией
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      { error: 'Ошибка при получении списка сотрудников' },
      { status: 500 }
    );
  }
}

// POST - создать нового сотрудника
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullname, phoneNumber, role = 'SELLER', password } = body;

    // Валидация
    if (!fullname || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'ФИО, телефон и пароль обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Валидация роли
    if (!['SELLER', 'COURIER'].includes(role)) {
      return NextResponse.json(
        { error: 'Недопустимая роль. Доступны: SELLER, COURIER' },
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

    // Проверка на уникальность телефона
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Сотрудник с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullname,
        phoneNumber,
        password: hashedPassword,
        role: role as UserRole,
        status: UserStatus.ACTIVE,
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сотрудника' },
      { status: 500 }
    );
  }
}