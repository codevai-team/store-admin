import { NextRequest, NextResponse } from 'next/server';

// GET - получить список филиалов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    // Временно не используемые параметры
    // const search = searchParams.get('search') || '';
    // const sortBy = searchParams.get('sortBy') || 'createdAt';
    // const sortOrder = searchParams.get('sortOrder') || 'desc';
    // const isActive = searchParams.get('isActive');
    // const skip = (page - 1) * limit;

    // Построение условий поиска (временно не используется)
    // const where: Record<string, unknown> = {};
    // if (search) {
    //   where.OR = [
    //     { name: { contains: search, mode: 'insensitive' } },
    //     { address: { contains: search, mode: 'insensitive' } },
    //     { phone: { contains: search, mode: 'insensitive' } },
    //     { location: { contains: search, mode: 'insensitive' } },
    //   ];
    // }
    // if (isActive !== null && isActive !== '') {
    //   where.isActive = isActive === 'true';
    // }

    // Получение филиалов с пагинацией
    // Временная заглушка - модель store не существует в схеме
    const stores: Array<{
      id: string;
      name: string;
      address: string;
      phone: string;
      location?: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      _count: { shifts: number; orders: number };
    }> = [];
    const totalCount = 0;

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
    // Временная заглушка - модель store не существует в схеме
    const existingStore = null;

    if (existingStore) {
      return NextResponse.json(
        { error: 'Филиал с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    // Временная заглушка - модель store не существует в схеме
    const store = {
      id: 'temp-id',
      name,
      address,
      phone,
      location,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        shifts: 0,
        orders: 0,
      },
    };

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании филиала' },
      { status: 500 }
    );
  }
}
