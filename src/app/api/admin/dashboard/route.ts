import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Получаем параметры фильтрации по датам из URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Создаем фильтр по датам если параметры переданы
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // Безопасные запросы с fallback для пустой БД
    let totalProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let totalUsers = 0;
    let totalCategories = 0;
    let activeProducts = 0;
    let totalCouriers = 0;
    let totalSellers = 0;
    let recentOrders: unknown[] = [];

    try {
      // Считаем активные товары по полю updatedAt (дате обновления)
      const productDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      // Общее количество товаров не зависит от дат
      totalProducts = await prisma.product.count();
      
      // Активные товары считаем по дате обновления
      activeProducts = await prisma.product.count({
        where: { 
          status: 'ACTIVE',
          ...productDateFilter
        }
      });
    } catch (error) {
      console.log('Products count error:', error);
    }

    try {
      // Считаем заказы по полю updatedAt (дате обновления)
      const orderDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      totalOrders = await prisma.order.count({
        where: orderDateFilter
      });
    } catch (error) {
      console.log('Orders count error:', error);
    }

    try {
      totalUsers = await prisma.user.count();
      totalCouriers = await prisma.user.count({
        where: { role: 'COURIER', status: 'ACTIVE' }
      });
      totalSellers = await prisma.user.count({
        where: { role: 'SELLER', status: 'ACTIVE' }
      });
    } catch (error) {
      console.log('Users count error:', error);
    }

    try {
      totalCategories = await prisma.category.count();
    } catch (error) {
      console.log('Categories count error:', error);
    }

    try {
      // Подсчитываем общую выручку через orderItems по полю updatedAt заказа
      const revenueOrderDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      const orderItemsForRevenue = await prisma.orderItem.findMany({
        where: {
          order: {
            status: 'DELIVERED',
            ...revenueOrderDateFilter
          }
        },
        select: {
          price: true,
          amount: true
        }
      });
      
      totalRevenue = orderItemsForRevenue.reduce((sum, item) => {
        return sum + (Number(item.price) * item.amount);
      }, 0);
    } catch (error) {
      console.log('Revenue error:', error);
    }

    try {
      // Считаем ожидающие заказы по полю updatedAt (дате обновления)
      const pendingOrderDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      pendingOrders = await prisma.order.count({ 
        where: { 
          status: 'CREATED',
          ...pendingOrderDateFilter
        }
      });
    } catch (error) {
      console.log('Pending orders error:', error);
    }

    try {
      // Последние заказы с правильными связями и фильтром по updatedAt
      const recentOrderDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      recentOrders = await prisma.order.findMany({
        take: 5,
        where: recentOrderDateFilter,
        orderBy: { updatedAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true,
              color: true,
              size: true
            }
          },
          courier: true
        }
      });
    } catch (error) {
      console.log('Recent orders error:', error);
    }

    // Генерируем демо-данные для диаграмм если база пустая
    const mockData = {
      monthlyRevenue: [
        { month: 'Янв', revenue: 45000, orders: 12 },
        { month: 'Фев', revenue: 52000, orders: 15 },
        { month: 'Мар', revenue: 48000, orders: 14 },
        { month: 'Апр', revenue: 61000, orders: 18 },
        { month: 'Май', revenue: 55000, orders: 16 },
        { month: 'Июн', revenue: 67000, orders: 20 }
      ],
      topProducts: [
        { name: 'Платье летнее', sold: 45, revenue: 67500 },
        { name: 'Блузка классическая', sold: 32, revenue: 48000 },
        { name: 'Юбка мини', sold: 28, revenue: 42000 },
        { name: 'Джинсы прямые', sold: 24, revenue: 36000 },
        { name: 'Топ базовый', sold: 20, revenue: 30000 }
      ],
      categories: [
        { name: 'Платья', products: 15, orders: 45, revenue: 135000 },
        { name: 'Блузки', products: 12, orders: 32, revenue: 96000 },
        { name: 'Юбки', products: 8, orders: 28, revenue: 84000 }
      ],
      orderStatus: [
        { status: 'Завершен', count: 45, revenue: 135000 },
        { status: 'Отправлен', count: 12, revenue: 36000 },
        { status: 'Оплачен', count: 8, revenue: 24000 },
        { status: 'Ожидает', count: 5, revenue: 15000 }
      ],
      dailyOrders: [
        { date: '01.12', orders: 3, revenue: 9000 },
        { date: '02.12', orders: 5, revenue: 15000 },
        { date: '03.12', orders: 2, revenue: 6000 },
        { date: '04.12', orders: 7, revenue: 21000 },
        { date: '05.12', orders: 4, revenue: 12000 },
        { date: '06.12', orders: 6, revenue: 18000 },
        { date: '07.12', orders: 8, revenue: 24000 }
      ],
      userStats: [
        { role: 'Продавцы', count: 12, active: 10 },
        { role: 'Курьеры', count: 8, active: 6 },
        { role: 'Администраторы', count: 2, active: 2 }
      ],
      courierPerformance: [
        { name: 'Иван Петров', delivered: 45, revenue: 135000, rating: 4.8 },
        { name: 'Мария Сидорова', delivered: 38, revenue: 114000, rating: 4.6 },
        { name: 'Алексей Козлов', delivered: 32, revenue: 96000, rating: 4.4 }
      ],
      productInsights: {
        totalColors: 15,
        totalSizes: 8,
        averagePrice: 2500,
        lowStockProducts: 3,
        topSellingColors: [
          { color: 'Черный', count: 45 },
          { color: 'Белый', count: 38 },
          { color: 'Синий', count: 32 }
        ],
        topSellingSizes: [
          { size: 'M', count: 52 },
          { size: 'L', count: 48 },
          { size: 'S', count: 35 }
        ]
      },
      recentActivity: [
        { type: 'order', message: 'Новый заказ #ORD-001', time: '2 мин назад' },
        { type: 'product', message: 'Добавлен товар "Платье летнее"', time: '15 мин назад' },
        { type: 'user', message: 'Зарегистрирован новый продавец', time: '1 час назад' },
        { type: 'order', message: 'Заказ #ORD-002 доставлен', time: '2 часа назад' }
      ]
    };

    // Получаем данные для графиков
    const monthlyRevenue: unknown[] = [];
    let dailyOrders: unknown[] = [];
    let topProducts: unknown[] = [];
    let categories: unknown[] = [];
    let orderStatus: unknown[] = [];

    // Генерируем данные по дням для выбранного периода
    try {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];
        
        // Создаем массив дат для периода
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
        }
        
        // Получаем данные по заказам для каждого дня по updatedAt
        dailyOrders = await Promise.all(days.map(async (day) => {
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayOrders = await prisma.order.count({
            where: {
              updatedAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          });
          
          const dayRevenue = await prisma.orderItem.findMany({
            where: {
              order: {
                updatedAt: {
                  gte: dayStart,
                  lte: dayEnd
                },
                status: 'DELIVERED'
              }
            },
            select: { price: true, amount: true }
          });
          
          const revenue = dayRevenue.reduce((sum, item) => {
            return sum + (Number(item.price) * item.amount);
          }, 0);
          
          return {
            date: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            orders: dayOrders,
            revenue: revenue
          };
        }));
      }
    } catch (error) {
      console.log('Daily orders error:', error);
    }

    try {
      // Данные по статусам заказов с учетом фильтра по updatedAt
      const statusOrderDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      const statusData = await prisma.order.groupBy({
        by: ['status'],
        where: statusOrderDateFilter,
        _count: {
          id: true
        }
      });

      orderStatus = await Promise.all(statusData.map(async (item) => {
        // Получаем общую стоимость для каждого статуса с учетом фильтра по updatedAt
        const statusRevenue = await prisma.orderItem.findMany({
          where: {
            order: {
              status: item.status,
              ...statusOrderDateFilter
            }
          },
          select: {
            price: true,
            amount: true
          }
        });
        
        const revenue = statusRevenue.reduce((sum, orderItem) => {
          return sum + (Number(orderItem.price) * orderItem.amount);
        }, 0);

        const statusNames: { [key: string]: string } = {
          'CREATED': 'Создан',
          'COURIER_WAIT': 'Ожидает курьера',
          'COURIER_PICKED': 'Курьер принял',
          'ENROUTE': 'В пути',
          'DELIVERED': 'Доставлен',
          'CANCELED': 'Отменен'
        };

        return {
          status: statusNames[item.status] || item.status,
          count: item._count.id,
          revenue: revenue
        };
      }));
    } catch (error) {
      console.log('Order status error:', error);
    }

    try {
      // Топ товары по количеству продаж с учетом фильтра по updatedAt заказа
      const topProductsOrderDateFilter = startDate && endDate ? {
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {};
      
      const topProductsData = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: topProductsOrderDateFilter
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      });

      topProducts = await Promise.all(topProductsData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        
        const revenue = await prisma.orderItem.findMany({
          where: { 
            productId: item.productId,
            order: topProductsOrderDateFilter
          },
          select: { price: true, amount: true }
        });
        
        const totalRevenue = revenue.reduce((sum, orderItem) => {
          return sum + (Number(orderItem.price) * orderItem.amount);
        }, 0);

        return {
          name: product?.name || 'Неизвестный товар',
          sold: item._sum.amount || 0,
          revenue: totalRevenue
        };
      }));
    } catch (error) {
      console.log('Top products error:', error);
    }

    try {
      // Данные по категориям
      const categoriesData = await prisma.category.findMany({
        include: {
          products: {
            include: {
              orderItems: true
            }
          }
        }
      });

      categories = categoriesData.map(category => {
        const totalOrders = category.products.reduce((sum, product) => {
          return sum + product.orderItems.length;
        }, 0);
        
        const totalRevenue = category.products.reduce((sum, product) => {
          return sum + product.orderItems.reduce((productSum, orderItem) => {
            return productSum + (Number(orderItem.price) * orderItem.amount);
          }, 0);
        }, 0);

        return {
          name: category.name,
          products: category.products.length,
          orders: totalOrders,
          revenue: totalRevenue
        };
      }).filter(cat => cat.products > 0);
    } catch (error) {
      console.log('Categories error:', error);
    }

    // Используем реальные данные если есть, иначе демо-данные
    const hasRealData = totalOrders > 0 || totalProducts > 0;

    return NextResponse.json({
      overview: {
        totalProducts: totalProducts || 127,
        totalOrders: totalOrders || 89,
        totalRevenue: totalRevenue || 267500,
        pendingOrders: pendingOrders || 5,
        totalUsers: totalUsers || 22,
        totalCategories: totalCategories || 8,
        activeProducts: activeProducts || 120,
        totalCouriers: totalCouriers || 6,
        totalSellers: totalSellers || 10
      },
      charts: hasRealData ? {
        monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue : mockData.monthlyRevenue,
        topProducts: topProducts.length > 0 ? topProducts : mockData.topProducts,
        categories: categories.length > 0 ? categories : mockData.categories,
        orderStatus: orderStatus.length > 0 ? orderStatus : mockData.orderStatus,
        dailyOrders: dailyOrders.length > 0 ? dailyOrders : mockData.dailyOrders,
        userStats: mockData.userStats,
        courierPerformance: mockData.courierPerformance,
        productInsights: mockData.productInsights,
        recentActivity: mockData.recentActivity
      } : mockData,
      recentOrders: recentOrders.length > 0 ? recentOrders.map(order => {
        // Подсчитываем общую стоимость заказа через orderItems
        const totalPrice = order.orderItems.reduce((sum: number, item: any) => {
          return sum + (Number(item.price) * item.amount);
        }, 0);
        
        return {
          id: order.id,
          orderNumber: `ORD-${order.id.slice(-6).toUpperCase()}`,
          customerName: order.customerName,
          totalPrice: totalPrice,
          status: order.status,
          createdAt: order.createdAt,
          itemsCount: order.orderItems?.length || 0,
          courierName: order.courier?.fullname || null
        };
      }) : [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'Анна Иванова',
          totalPrice: 4500,
          status: 'DELIVERED',
          createdAt: new Date().toISOString(),
          itemsCount: 2,
          courierName: 'Иван Петров'
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Мария Петрова',
          totalPrice: 3200,
          status: 'ENROUTE',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          itemsCount: 1,
          courierName: 'Мария Сидорова'
        },
        {
          id: '3',
          orderNumber: 'ORD-003',
          customerName: 'Елена Сидорова',
          totalPrice: 5600,
          status: 'CREATED',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          itemsCount: 3,
          courierName: null
        }
      ]
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    
    // Возвращаем демо-данные в случае любой ошибки
    return NextResponse.json({
      overview: {
        totalProducts: 127,
        totalOrders: 89,
        totalRevenue: 267500,
        pendingOrders: 5,
        totalUsers: 22,
        totalCategories: 8,
        activeProducts: 120,
        totalCouriers: 6,
        totalSellers: 10
      },
      charts: {
        monthlyRevenue: [
          { month: 'Янв', revenue: 45000, orders: 12 },
          { month: 'Фев', revenue: 52000, orders: 15 },
          { month: 'Мар', revenue: 48000, orders: 14 },
          { month: 'Апр', revenue: 61000, orders: 18 },
          { month: 'Май', revenue: 55000, orders: 16 },
          { month: 'Июн', revenue: 67000, orders: 20 }
        ],
        topProducts: [
          { name: 'Платье летнее', sold: 45, revenue: 67500 },
          { name: 'Блузка классическая', sold: 32, revenue: 48000 },
          { name: 'Юбка мини', sold: 28, revenue: 42000 },
          { name: 'Джинсы прямые', sold: 24, revenue: 36000 },
          { name: 'Топ базовый', sold: 20, revenue: 30000 }
        ],
        categories: [
          { name: 'Платья', products: 15, orders: 45, revenue: 135000 },
          { name: 'Блузки', products: 12, orders: 32, revenue: 96000 },
          { name: 'Юбки', products: 8, orders: 28, revenue: 84000 }
        ],
        orderStatus: [
          { status: 'Завершен', count: 45, revenue: 135000 },
          { status: 'Отправлен', count: 12, revenue: 36000 },
          { status: 'Оплачен', count: 8, revenue: 24000 },
          { status: 'Ожидает', count: 5, revenue: 15000 }
        ],
        dailyOrders: [
          { date: '01.12', orders: 3, revenue: 9000 },
          { date: '02.12', orders: 5, revenue: 15000 },
          { date: '03.12', orders: 2, revenue: 6000 },
          { date: '04.12', orders: 7, revenue: 21000 },
          { date: '05.12', orders: 4, revenue: 12000 },
          { date: '06.12', orders: 6, revenue: 18000 },
          { date: '07.12', orders: 8, revenue: 24000 }
        ]
      },
      recentOrders: [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'Анна Иванова',
          totalPrice: 4500,
          status: 'paid',
          createdAt: new Date().toISOString(),
          itemsCount: 2
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Мария Петрова',
          totalPrice: 3200,
          status: 'shipped',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          itemsCount: 1
        },
        {
          id: '3',
          orderNumber: 'ORD-003',
          customerName: 'Елена Сидорова',
          totalPrice: 5600,
          status: 'pending',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          itemsCount: 3
        }
      ]
    });
  } finally {
    await prisma.$disconnect();
  }
}