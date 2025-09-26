import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

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
    const contactType = searchParams.get('contactType');
    const paymentStatus = searchParams.get('paymentStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    
    // Параметры сортировки
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Строим условия фильтрации
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (contactType && contactType !== 'all') {
      where.contactType = contactType;
    }

    if (search && search.trim()) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        // Проверяем, содержит ли строка время
        const fromDate = dateFrom.includes('T') ? new Date(dateFrom) : new Date(dateFrom + 'T00:00:00.000Z');
        if (!isNaN(fromDate.getTime())) {
          where.createdAt.gte = fromDate;
        }
      }
      if (dateTo) {
        // Проверяем, содержит ли строка время
        const toDate = dateTo.includes('T') ? new Date(dateTo) : new Date(dateTo + 'T23:59:59.999Z');
        if (!isNaN(toDate.getTime())) {
          where.createdAt.lte = toDate;
        }
      }
    }

    // Условия для фильтрации по статусу платежа
    if (paymentStatus && paymentStatus !== 'all') {
      where.payment = {
        status: paymentStatus
      };
    }

    // Строим условия сортировки
    const orderBy: any = {};
    if (sortBy === 'totalPrice') {
      orderBy.totalPrice = sortOrder;
    } else if (sortBy === 'customerName') {
      orderBy.customerName = sortOrder;
    } else if (sortBy === 'orderNumber') {
      orderBy.orderNumber = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Получаем заказы с подсчетом общего количества и статистики
    const [orders, totalCount, stats] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      name: true,
                      category: {
                        select: {
                          name: true
                        }
                      }
                    }
                  },
                  images: {
                    where: { isMain: true },
                    take: 1
                  }
                }
              }
            }
          },
          payment: true
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
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const productsCount = order.items.length;
      
      return {
        ...order,
        totalPrice: Number(order.totalPrice),
        itemsCount,
        productsCount,
        items: order.items.map(item => ({
          ...item,
          price: Number(item.price),
          variant: {
            ...item.variant,
            price: Number(item.variant.price),
            discountPrice: item.variant.discountPrice ? Number(item.variant.discountPrice) : null,
            mainImage: item.variant.images?.[0]?.imageUrl || null
          }
        })),
        payment: order.payment ? {
          ...order.payment,
          amount: Number(order.payment.amount)
        } : null
      };
    });

    // Обрабатываем статистику по статусам
    const statusStats = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      COMPLETED: 0,
      CANCELLED: 0
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
      { error: 'Ошибка получения заказов', details: error?.message || 'Unknown error' },
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
      contactType, 
      customerAddress, 
      items, 
      paymentMethod 
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

    if (!contactType || !['WHATSAPP', 'CALL'].includes(contactType)) {
      return NextResponse.json(
        { error: 'Тип контакта обязателен' },
        { status: 400 }
      );
    }

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

    // Проверяем существование вариантов товаров и их наличие
    const variantIds = items.map((item: any) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            name: true,
            isActive: true
          }
        }
      }
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json(
        { error: 'Один или несколько товаров не найдены' },
        { status: 400 }
      );
    }

    // Проверяем наличие товаров
    for (const item of items) {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant) continue;

      if (!variant.product.isActive) {
        return NextResponse.json(
          { error: `Товар "${variant.product.name}" неактивен` },
          { status: 400 }
        );
      }

      if (variant.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Недостаточно товара "${variant.product.name}" на складе` },
          { status: 400 }
        );
      }
    }

    // Вычисляем общую стоимость
    let totalPrice = 0;
    for (const item of items) {
      const variant = variants.find(v => v.id === item.variantId);
      if (variant) {
        const price = variant.discountPrice || variant.price;
        totalPrice += Number(price) * item.quantity;
      }
    }

    // Генерируем номер заказа
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Создаем заказ в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем заказ
      const order = await tx.order.create({
        data: {
          orderNumber,
          totalPrice,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          contactType,
          customerAddress: customerAddress.trim()
        }
      });

      // Создаем элементы заказа и обновляем количество товаров
      for (const item of items) {
        const variant = variants.find(v => v.id === item.variantId);
        if (!variant) continue;

        const price = variant.discountPrice || variant.price;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            price: price
          }
        });

        // Уменьшаем количество товара на складе
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // Создаем запись платежа, если указан способ оплаты
      if (paymentMethod && ['CARD', 'WALLET', 'MBANK', 'ELCART'].includes(paymentMethod)) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            paymentMethod,
            amount: totalPrice
          }
        });
      }

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания заказа', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
