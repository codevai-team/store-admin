import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';

interface OrderItem {
  orderId: string;
  orderDate: Date;
  items: unknown[];
  total: number;
  status: OrderStatus;
}

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Параметры фильтрации
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    
    
    // Строим условия фильтрации
    const where: Prisma.OrderWhereInput = {
      status: {
        in: [OrderStatus.DELIVERED, OrderStatus.CREATED, OrderStatus.COURIER_WAIT, OrderStatus.COURIER_PICKED, OrderStatus.ENROUTE]
      }
    };

    // Для курьеров и продавцов показываем только доставленные заказы
    if (userRole === 'COURIER' || userRole === 'SELLER') {
      where.status = OrderStatus.DELIVERED;
    }

    // Фильтр по дате
    if (dateFrom) {
      const existingUpdatedAt = where.updatedAt as Prisma.DateTimeFilter || {};
      where.updatedAt = {
        ...existingUpdatedAt,
        gte: new Date(dateFrom) // dateFrom уже приходит в правильном формате с +06:00
      };
    }
    
    if (dateTo) {
      // dateTo уже приходит в правильном формате с +06:00 и временем 23:59
      const existingUpdatedAt = where.updatedAt as Prisma.DateTimeFilter || {};
      where.updatedAt = {
        ...existingUpdatedAt,
        lte: new Date(dateTo)
      };
    }

    // Фильтр по сотруднику
    if (userId) {
      if (userRole === 'SELLER') {
        where.orderItems = {
          some: {
            product: {
              sellerId: userId
            }
          }
        };
      } else if (userRole === 'COURIER') {
        where.courierId = userId;
      }
    } else if (userRole === 'COURIER' || userRole === 'SELLER') {
      // Если выбрана только роль, показываем все доставленные заказы
      // Дополнительные фильтры не нужны, так как уже установлен статус DELIVERED
    }


    // Поиск
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Получаем заказы с детальной информацией
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    fullname: true,
                    role: true
                  }
                }
              }
            }
          }
        },
        courier: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });


    // Группируем данные по заказам и сотрудникам
    const statistics = {
      totalOrders: orders.length,
      totalRevenue: 0,
      sellerStats: new Map(),
      courierStats: new Map()
    };

    const processedOrders = orders.map(order => {
        // Если выбран конкретный продавец, проверяем что в заказе есть его товары
        if (userId && userRole === 'SELLER') {
          const hasSellerItems = order.orderItems.some(item => item.product.sellerId === userId);
          if (!hasSellerItems) {
            return null; // Пропускаем заказы без товаров этого продавца
          }
        }
        
        // Для курьеров фильтрация уже выполнена в where условии
        // Дополнительная проверка не нужна
        
        const orderTotal = order.orderItems.reduce((sum, item) => sum + (Number(item.price) * item.amount), 0);
        
        // Группируем товары по продавцам
        const sellerGroups = new Map();
        order.orderItems.forEach(item => {
          const sellerId = item.product.sellerId;
          
          // Если выбран конкретный продавец, обрабатываем только его товары
          if (userId && userRole === 'SELLER' && sellerId !== userId) {
            return; // Пропускаем товары других продавцов
          }
          
          if (!sellerGroups.has(sellerId)) {
            sellerGroups.set(sellerId, {
              seller: item.product.seller,
              items: [],
              total: 0
            });
          }
          sellerGroups.get(sellerId).items.push(item);
          sellerGroups.get(sellerId).total += Number(item.price) * item.amount;
        });

        // Обновляем статистику продавцов
        sellerGroups.forEach((group, sellerId) => {
          if (!statistics.sellerStats.has(sellerId)) {
            statistics.sellerStats.set(sellerId, {
              seller: group.seller,
              totalRevenue: 0,
              totalOrders: 0,
              orders: []
            });
          }
          const sellerStat = statistics.sellerStats.get(sellerId);
          sellerStat.totalRevenue += group.total;
          
          // Для продавца считаем количество заказов, в которых есть его товары
          // Но не увеличиваем счетчик, если этот заказ уже был учтен для этого продавца
          const existingOrder = sellerStat.orders.find((o: OrderItem) => o.orderId === order.id);
          if (!existingOrder) {
            sellerStat.totalOrders += 1;
            sellerStat.orders.push({
              orderId: order.id,
              orderDate: order.createdAt,
              items: group.items,
              total: group.total,
              status: order.status
            });
          } else {
            // Если заказ уже существует, обновляем его данные
            existingOrder.items = group.items;
            existingOrder.total = group.total;
            existingOrder.status = order.status;
          }
        });

        // Обновляем статистику курьеров
        if (order.courier) {
          const courierId = order.courier.id;
          
          if (!statistics.courierStats.has(courierId)) {
            statistics.courierStats.set(courierId, {
              courier: order.courier,
              totalOrders: 0,
              totalRevenue: 0,
              orders: []
            });
          }
          const courierStat = statistics.courierStats.get(courierId);
          courierStat.totalOrders += 1;
          // Для курьера считаем полную стоимость заказа, который он доставил
          courierStat.totalRevenue += orderTotal;
          courierStat.orders.push({
            orderId: order.id,
            orderDate: order.createdAt,
            total: orderTotal,
            status: order.status,
            items: order.orderItems
          });
        }

        // Для общей выручки считаем только товары выбранного продавца, если он выбран
        if (userId && userRole === 'SELLER') {
          // Считаем только товары выбранного продавца
          const sellerRevenue = order.orderItems
            .filter(item => item.product.sellerId === userId)
            .reduce((sum, item) => sum + (Number(item.price) * item.amount), 0);
          statistics.totalRevenue += sellerRevenue;
        } else {
          // Если не выбран конкретный продавец, считаем полную стоимость заказа
          statistics.totalRevenue += orderTotal;
        }

        return {
          id: order.id,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          status: order.status,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
          totalPrice: orderTotal,
          sellerGroups: Array.from(sellerGroups.values()),
          courier: order.courier,
          orderItems: order.orderItems.map(item => ({
            ...item,
            price: Number(item.price),
            product: {
              ...item.product,
              price: Number(item.product.price)
            }
          }))
        };
      }).filter(order => order !== null); // Фильтруем null значения

    // Преобразуем Map в массивы для JSON
    const sellerStatsArray = Array.from(statistics.sellerStats.values());
    const courierStatsArray = Array.from(statistics.courierStats.values());


    return NextResponse.json({
      statistics: {
        totalOrders: statistics.totalOrders,
        totalRevenue: statistics.totalRevenue,
        sellerStats: sellerStatsArray,
        courierStats: courierStatsArray
      },
      orders: processedOrders
    });

  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}
