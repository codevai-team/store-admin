import { NextRequest, NextResponse } from 'next/server';

// GET - получить филиал по ID
export async function GET() {
  try {
    // Временная заглушка - модель store не существует в схеме
    const store = null;

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
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, phone, location } = body;

    // Валидация
    if (!name || !address || !phone || !location) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверка на существование филиала
    // Временная заглушка - модель store не существует в схеме
    const existingStore = null;

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Филиал не найден' },
        { status: 404 }
      );
    }

    // Проверка на уникальность телефона (исключая текущий филиал)
    // Временная заглушка - модель store не существует в схеме
    const storeWithSamePhone = null;

    if (storeWithSamePhone) {
      return NextResponse.json(
        { error: 'Филиал с таким номером телефона уже существует' },
        { status: 400 }
      );
    }

    // Временная заглушка - модель store не существует в схеме
    const store = null;

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
export async function DELETE() {
  try {
    // Проверка на существование филиала
    // Временная заглушка - модель store не существует в схеме
    const existingStore = null;

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Филиал не найден' },
        { status: 404 }
      );
    }

    // Проверка на связанные данные (временно отключена)
    // if (existingStore._count.shifts > 0) {
    //   return NextResponse.json(
    //     { error: 'Невозможно удалить филиал с активными сменами' },
    //     { status: 400 }
    //   );
    // }

    // if (existingStore._count.orders > 0) {
    //   return NextResponse.json(
    //     { error: 'Невозможно удалить филиал с заказами' },
    //     { status: 400 }
    //   );
    // }

    // Временная заглушка - модель store не существует в схеме
    // await prisma.store.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Филиал успешно удален' });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении филиала' },
      { status: 500 }
    );
  }
}
