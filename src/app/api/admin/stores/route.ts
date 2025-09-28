import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить список филиалов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Построение условий поиска
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Получение филиалов с пагинацией
    const [stores, totalCount] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              shifts: true,
              orders: true,
            },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      stores,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении филиалов' },
      { status: 500 }
    );
  }
}

// POST - создать новый филиал
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, phone, location, isActive = true } = body;

    // Валидация
    if (!name || !address || !phone || !location) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверка на уникальность телефона
    const existingStore = await prisma.store.findFirst({
      where: { phone },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: 'Филиал с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    const store = await prisma.store.create({
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

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании филиала' },
      { status: 500 }
    );
  }
}
