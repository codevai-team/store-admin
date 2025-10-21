import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import { getBishkekTimeAsUTC } from '@/lib/timezone';

const prisma = new PrismaClient();

// GET - получить все заказы с пагинацией и фильтрацией
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Параметры пагинации
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Параметры фильтрации
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    
    // Параметры сортировки
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Строим условия фильтрации
    const where: Prisma.OrderWhereInput = {};

    if (status && status !== 'all') {
      // Если статус содержит запятые, разделяем на массив и используем оператор in
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim()).filter(s => s) as OrderStatus[];
        where.status = { in: statusArray };
      } else {
        where.status = status as OrderStatus;
      }
    }

    // contactType removed as it doesn't exist in new schema

    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
        { deliveryAddress: { contains: searchTerm, mode: 'insensitive' } }
      ];
      
      // Если поисковый запрос содержит только цифры, также ищем по номеру без символов
      if (/^\d+$/.test(searchTerm)) {
        where.OR.push({
          customerPhone: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        });
      }
    }

    if (dateFrom || dateTo) {
      where.updatedAt = {};
      if (dateFrom) {
        // dateFrom уже приходит в правильном формате с +06:00 из фронтенда
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          where.updatedAt.gte = fromDate;
        }
      }
      if (dateTo) {
        // dateTo уже приходит в правильном формате с +06:00 из фронтенда
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          where.updatedAt.lte = toDate;
        }
      }
    }

    // Условия для фильтрации по статусу платежа
    // paymentStatus removed as payment model doesn't exist in new schema

    // Строим условия сортировки
    const orderBy: Record<string, string> = {};
    
    // Для вычисляемых полей (totalPrice, itemsCount) используем сортировку по умолчанию,
    // а затем сортируем в JavaScript после получения данных
    if (sortBy === 'totalPrice' || sortBy === 'itemsCount') {
      // Используем сортировку по updatedAt по умолчанию для вычисляемых полей
      orderBy['updatedAt'] = 'desc';
    } else {
      // Для обычных полей используем стандартную сортировку
      orderBy[sortBy] = sortOrder;
    }

    // Получаем заказы с подсчетом общего количества и статистики
    const [orders, totalCount, stats] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          courier: {
            select: {
              id: true,
              fullname: true,
              phoneNumber: true
            }
          },
          orderItems: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true
                    }
                  },
                  seller: {
                    select: {
                      id: true,
                      fullname: true
                    }
                  }
                }
              },
              size: {
                select: {
                  id: true,
                  name: true
                }
              },
              color: {
                select: {
                  id: true,
                  name: true,
                  colorCode: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.order.count({ where }),
      // Получаем статистику по статусам с теми же фильтрами
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true
        }
      })
    ]);

    // Преобразуем данные для фронтенда
    const transformedOrders = orders.map(order => {
      const itemsCount = order.orderItems.reduce((sum, item) => sum + item.amount, 0);
      const productsCount = order.orderItems.length;
      const totalPrice = order.orderItems.reduce((sum, item) => sum + (Number(item.price) * item.amount), 0);
      
      return {
        ...order,
        totalPrice,
        itemsCount,
        productsCount,
        orderItems: order.orderItems.map(item => ({
          ...item,
          price: Number(item.price),
          product: {
            ...item.product,
            price: Number(item.product.price),
            imageUrl: item.product.imageUrl // This is already JSON array
          }
        }))
      };
    });

    // Сортируем по вычисляемым полям если необходимо
    if (sortBy === 'totalPrice' || sortBy === 'itemsCount') {
      transformedOrders.sort((a, b) => {
        const valueA = sortBy === 'totalPrice' ? a.totalPrice : a.itemsCount;
        const valueB = sortBy === 'totalPrice' ? b.totalPrice : b.itemsCount;
        
        if (sortOrder === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      });
    }

    // Обрабатываем статистику по статусам
    const statusStats = {
      CREATED: 0,
      COURIER_WAIT: 0,
      COURIER_PICKED: 0,
      ENROUTE: 0,
      DELIVERED: 0,
      CANCELED: 0
    };

    stats.forEach(stat => {
      if (stat.status in statusStats) {
        statusStats[stat.status as keyof typeof statusStats] = stat._count.status;
      }
    });

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      statistics: statusStats
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения заказов', details: (error as Error)?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - создать новый заказ (если нужно)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      customerPhone, 
      customerAddress, 
      items
    } = body;

    // Валидация
    if (!customerName?.trim()) {
      return NextResponse.json(
        { error: 'Имя клиента обязательно' },
        { status: 400 }
      );
    }

    if (!customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'Телефон клиента обязателен' },
        { status: 400 }
      );
    }

    // Валидация типа контакта пока не используется
    // if (!contactType || !['WHATSAPP', 'CALL'].includes(contactType)) {
    //   return NextResponse.json(
    //     { error: 'Тип контакта обязателен' },
    //     { status: 400 }
    //   );
    // }

    if (!customerAddress?.trim()) {
      return NextResponse.json(
        { error: 'Адрес клиента обязателен' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Должен быть хотя бы один товар в заказе' },
        { status: 400 }
      );
    }

    // Проверяем существование товаров (временная заглушка, так как productVariant не существует)
    const variantIds = items.map((item: { variantId: string; quantity: number }) => item.variantId);
    // Временная заглушка - в реальности нужно проверить через Product модель
    // const variants: Array<{
    //   id: string;
    //   quantity: number;
    //   price: number;
    //   discountPrice?: number;
    //   product: { name: string; isActive: boolean };
    // }> = [];

    // Временная заглушка для проверки товаров
    // В реальности здесь должна быть проверка через Product модель
    if (variantIds.length === 0) {
      return NextResponse.json(
        { error: 'Список товаров пуст' },
        { status: 400 }
      );
    }

    // Вычисляем общую стоимость (временная заглушка)
    // let totalPrice = 0;
    // for (const item of items) {
    //   // Временная заглушка - в реальности нужно получить цену из Product
    //   const defaultPrice = 100; // Временная цена
    //   totalPrice += defaultPrice * item.quantity;
    // }

    // Генерируем номер заказа (пока не используется)
    // const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Создаем заказ в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем заказ с правильным временем для Бишкека
      const bishkekTime = getBishkekTimeAsUTC();
      const order = await tx.order.create({
        data: {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: customerAddress.trim(),
          createdAt: bishkekTime,
          updatedAt: bishkekTime
        }
      });

      // Создаем элементы заказа (временная заглушка)
      for (const item of items) {
        const defaultPrice = 100; // Временная цена

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.variantId, // Используем как productId
            amount: item.quantity,
            price: defaultPrice
          }
        });

        // Обновление количества товара на складе пока не реализовано
        // так как productVariant модель не существует
      }

      // Создание записи платежа пока не реализовано
      // так как payment модель не существует
      // if (paymentMethod && ['CARD', 'WALLET', 'MBANK', 'ELCART'].includes(paymentMethod)) {
      //   // Здесь будет создание записи платежа
      // }

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания заказа', details: (error as Error)?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
