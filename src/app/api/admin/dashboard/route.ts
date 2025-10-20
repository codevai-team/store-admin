import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toBishkekTime, getBishkekNow, getLastNDaysInBishkek } from '@/lib/timezone';


// Функция для форматирования времени "сколько времени назад"
function getTimeAgo(date: Date): string {
  const now = getBishkekNow();
  const bishkekDate = toBishkekTime(date);
  const diffInSeconds = Math.floor((now.getTime() - bishkekDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} сек назад`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} мин назад`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ч назад`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} дн назад`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} нед назад`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} мес назад`;
}

export async function GET(request: Request) {
  try {
    // Получаем параметры фильтрации по датам из URL (как на странице статистики)
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const section = searchParams.get('section'); // 'overview', 'charts', 'recentOrders', или null для всех данных
    
    
    // Создаем фильтр по датам если параметры переданы
    // Конвертируем входящие даты в UTC с учетом временной зоны Бишкека

    // Безопасные запросы с fallback для пустой БД
    let totalProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let totalCategories = 0;
    let activeProducts = 0;
    let totalCouriers = 0;
    let totalSellers = 0;
    let netRevenue = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recentOrders: any[] = [];

    try {
      // Общее количество товаров не зависит от дат
      totalProducts = await prisma.product.count();
      
      // Активные товары - все товары со статусом ACTIVE (без учета периода)
      activeProducts = await prisma.product.count({
        where: { 
          status: 'ACTIVE'
        }
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка подсчета товаров
    }

    try {
      // Считаем заказы по полю updatedAt (как на странице статистики)
      const orderDateFilter = dateFrom && dateTo ? {
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      } : {};
      
      totalOrders = await prisma.order.count({
        where: orderDateFilter
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка подсчета заказов
    }

    try {
      totalCouriers = await prisma.user.count({
        where: { role: 'COURIER', status: 'ACTIVE' }
      });
      totalSellers = await prisma.user.count({
        where: { role: 'SELLER', status: 'ACTIVE' }
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка подсчета пользователей
    }

    // Получаем статистику пользователей по ролям
    let userStats: Array<{ role: string; count: number; active: number }> = [];
    try {
      const userStatsData = await prisma.user.groupBy({
        by: ['role', 'status'],
        _count: {
          id: true
        }
      });

      // Группируем данные по ролям
      const statsByRole: { [key: string]: { total: number; active: number } } = {};
      
      userStatsData.forEach(item => {
        if (!statsByRole[item.role]) {
          statsByRole[item.role] = { total: 0, active: 0 };
        }
        
        statsByRole[item.role].total += item._count.id;
        
        if (item.status === 'ACTIVE') {
          statsByRole[item.role].active += item._count.id;
        }
      });

      // Преобразуем в нужный формат
      userStats = Object.entries(statsByRole).map(([role, stats]) => {
        const roleNames: { [key: string]: string } = {
          'SELLER': 'Продавцы',
          'COURIER': 'Курьеры', 
          'ADMIN': 'Администраторы'
        };
        
        return {
          role: roleNames[role] || role,
          count: stats.total,
          active: stats.active
        };
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения статистики пользователей
    }

    // Получаем статистику производительности курьеров
    let courierPerformance: Array<{ name: string; delivered: number; revenue: number }> = [];
    try {
      // Создаем фильтр по датам для доставленных заказов
      const courierOrderDateFilter = dateFrom && dateTo ? {
        status: 'DELIVERED' as const,
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      } : {
        status: 'DELIVERED' as const
      };

      // Получаем всех курьеров с их доставленными заказами в диапазоне дат
      const couriers = await prisma.user.findMany({
        where: { 
          role: 'COURIER',
          status: 'ACTIVE'
        },
        include: {
          deliveredOrders: {
            where: courierOrderDateFilter,
            include: {
              orderItems: {
                select: {
                  price: true,
                  amount: true
                }
              }
            }
          }
        }
      });

      // Обрабатываем данные для каждого курьера
      courierPerformance = couriers.map(courier => {
        const deliveredCount = courier.deliveredOrders.length;
        
        // Подсчитываем общую выручку от доставленных заказов
        const totalRevenue = courier.deliveredOrders.reduce((sum, order) => {
          const orderRevenue = order.orderItems.reduce((orderSum, item) => {
            return orderSum + (Number(item.price) * item.amount);
          }, 0);
          return sum + orderRevenue;
        }, 0);

        return {
          name: courier.fullname,
          delivered: deliveredCount,
          revenue: totalRevenue
        };
      }).sort((a, b) => b.delivered - a.delivered) // Сортируем по количеству доставок
        .slice(0, 3); // Показываем топ-3 курьеров

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения статистики курьеров
    }

    // Получаем аналитику товаров
    let productInsights: {
      totalColors: number;
      totalSizes: number;
      averagePrice: number;
      deliveryCancelRate: {
        delivered: number;
        canceled: number;
      };
      topSellingColors: Array<{ color: string; count: number }>;
      topSellingSizes: Array<{ size: string; count: number }>;
    } = {
      totalColors: 0,
      totalSizes: 0,
      averagePrice: 0,
      deliveryCancelRate: { delivered: 0, canceled: 0 },
      topSellingColors: [],
      topSellingSizes: []
    };

    try {
      // Общее количество цветов и размеров
      const totalColors = await prisma.color.count();
      const totalSizes = await prisma.size.count();

      // Средняя цена товаров
      const avgPriceResult = await prisma.product.aggregate({
        _avg: {
          price: true
        }
      });
      const averagePrice = avgPriceResult._avg.price ? Number(avgPriceResult._avg.price) : 0;

      // Проценты доставки и отмены заказов
      const totalOrders = await prisma.order.count();
      const deliveredOrders = await prisma.order.count({
        where: { status: 'DELIVERED' }
      });
      const canceledOrders = await prisma.order.count({
        where: { status: 'CANCELED' }
      });

      const deliveredPercent = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
      const canceledPercent = totalOrders > 0 ? Math.round((canceledOrders / totalOrders) * 100) : 0;

      // Популярные цвета из таблицы products (через productColors)
      const topColorsData = await prisma.productColor.groupBy({
        by: ['colorId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 3
      });

      const topSellingColors = await Promise.all(topColorsData.map(async (item) => {
        const color = await prisma.color.findUnique({
          where: { id: item.colorId }
        });
        return {
          color: color?.name || 'Неизвестный',
          count: item._count.id
        };
      }));

      // Популярные размеры из таблицы products (через productSizes)
      const topSizesData = await prisma.productSize.groupBy({
        by: ['sizeId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 3
      });

      const topSellingSizes = await Promise.all(topSizesData.map(async (item) => {
        const size = await prisma.size.findUnique({
          where: { id: item.sizeId }
        });
        return {
          size: size?.name || 'Неизвестный',
          count: item._count.id
        };
      }));

      productInsights = {
        totalColors,
        totalSizes,
        averagePrice,
        deliveryCancelRate: {
          delivered: deliveredPercent,
          canceled: canceledPercent
        },
        topSellingColors,
        topSellingSizes
      };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения аналитики товаров
    }

    // Получаем последнюю активность
    let recentActivity: Array<{ type: string; message: string; time: string; createdAt: string }> = [];
    try {
      // Получаем последние заказы
      const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          customerName: true,
          status: true,
          createdAt: true
        }
      });

      // Получаем последние товары
      const recentProducts = await prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      });

      // Получаем последних пользователей
      const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullname: true,
          role: true,
          createdAt: true
        }
      });

      // Формируем массив активности
      const activities: Array<{ type: string; message: string; time: string; createdAt: string }> = [];

      // Добавляем заказы
      recentOrders.forEach(order => {
        const statusNames: { [key: string]: string } = {
          'CREATED': 'создан',
          'COURIER_WAIT': 'ожидает курьера',
          'COURIER_PICKED': 'принят курьером',
          'ENROUTE': 'в пути',
          'DELIVERED': 'доставлен',
          'CANCELED': 'отменен'
        };

        activities.push({
          type: 'order',
          message: `Заказ #${order.id.slice(-6).toUpperCase()} от ${order.customerName} ${statusNames[order.status] || order.status}`,
          time: getTimeAgo(order.createdAt),
          createdAt: order.createdAt.toISOString()
        });
      });

      // Добавляем товары
      recentProducts.forEach(product => {
        activities.push({
          type: 'product',
          message: `Добавлен товар "${product.name}"`,
          time: getTimeAgo(product.createdAt),
          createdAt: product.createdAt.toISOString()
        });
      });

      // Добавляем пользователей
      recentUsers.forEach(user => {
        const roleNames: { [key: string]: string } = {
          'SELLER': 'продавец',
          'COURIER': 'курьер',
          'ADMIN': 'администратор'
        };

        activities.push({
          type: 'user',
          message: `Зарегистрирован ${roleNames[user.role] || user.role} ${user.fullname}`,
          time: getTimeAgo(user.createdAt),
          createdAt: user.createdAt.toISOString()
        });
      });

      // Сортируем по дате создания и берем последние 6
      recentActivity = activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения последней активности
    }

    try {
      totalCategories = await prisma.category.count();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка подсчета категорий
    }

    try {
      // Получаем данные из API долгов продавцов (как на странице статистики)
      // Создаем фильтр по датам для заказов (используем updatedAt для консистентности с графиками)
      const dateFilter = dateFrom && dateTo ? {
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      } : {};

      // Получаем все доставленные заказы с товарами и продавцами (точно как в API долгов)
      const deliveredOrders = await prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          ...dateFilter
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  seller: {
                    include: {
                      commissions: {
                        orderBy: {
                          createdAt: 'desc'
                        },
                        take: 1
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Рассчитываем общую выручку и чистую прибыль (точно как в API долгов)
      let calculatedTotalRevenue = 0;
      let calculatedNetRevenue = 0;

      deliveredOrders.forEach(order => {
        order.orderItems.forEach(item => {
          const itemTotal = Number(item.price) * item.amount;
          const sellerCommission = Number(item.product.seller.commissions[0]?.rate || 0);
          const adminPercentage = sellerCommission / 100;
          
          // Общая выручка
          calculatedTotalRevenue += itemTotal;
          
          // Базовая цена продавца = itemTotal / (1 + adminPercentage)
          const basePrice = adminPercentage > 0 
            ? itemTotal / (1 + adminPercentage)
            : itemTotal;
          
          // Прибыль админа = itemTotal - basePrice
          const adminProfit = itemTotal - basePrice;
          calculatedNetRevenue += adminProfit;
        });
      });

      totalRevenue = Math.round(calculatedTotalRevenue * 100) / 100;
      netRevenue = Math.round(calculatedNetRevenue * 100) / 100;
      
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка подсчета дохода
    }

    // Чистая выручка уже рассчитана выше в том же блоке, что и общая выручка


    try {
      // Считаем ожидающие заказы по полю updatedAt (как на странице статистики)
      const pendingOrderDateFilter = dateFrom && dateTo ? {
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      } : {};
      
      pendingOrders = await prisma.order.count({ 
        where: { 
          status: 'CREATED',
          ...pendingOrderDateFilter
        }
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка подсчета ожидающих заказов
    }

    try {
      // Последние заказы с правильными связями и фильтром по updatedAt
      const recentOrderDateFilter = dateFrom && dateTo ? {
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      } : {};
      
      recentOrders = await prisma.order.findMany({
        take: 4,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения последних заказов
    }


    // Получаем данные для графиков
    let monthlyRevenue: Array<{ month: string; revenue: number; canceledRevenue: number; orders: number }> = [];
    let dailyOrders: Array<{ date: string; orders: number; deliveredOrders: number; revenue: number }> = [];
    let topProducts: Array<{ name: string; sold: number; revenue: number }> = [];
    let categories: Array<{ name: string; products: number; orders: number; revenue: number }> = [];
    let orderStatus: Array<{ status: string; count: number; revenue: number }> = [];

    // Генерируем данные по доходам для выбранного периода
    try {
      if (dateFrom && dateTo) {
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Определяем интервал группировки в зависимости от длительности периода
        let groupBy = 'day';
        
        if (diffDays > 90) {
          groupBy = 'month';
        } else if (diffDays > 14) {
          groupBy = 'week';
        }
        
        if (groupBy === 'day') {
          // Группировка по дням
          const days = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
          }
          
          monthlyRevenue = await Promise.all(days.map(async (day) => {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayOrdersCount = await prisma.order.count({
              where: {
                updatedAt: {
                  gte: dayStart,
                  lte: dayEnd
                }
              }
            });
            
            
            // Используем Prisma для получения доходов от доставленных заказов
            const deliveredOrdersForDay = await prisma.order.findMany({
              where: {
                status: 'DELIVERED',
                updatedAt: {
                  gte: dayStart,
                  lte: dayEnd
                }
              },
              include: {
                orderItems: {
                  select: {
                    amount: true,
                    price: true
                  }
                }
              }
            });
            
            // Рассчитываем доход от доставленных заказов
            const dayRevenue = deliveredOrdersForDay.reduce((totalRevenue, order) => {
              const orderRevenue = order.orderItems.reduce((orderSum, item) => {
                return orderSum + (Number(item.price) * item.amount);
              }, 0);
              return totalRevenue + orderRevenue;
            }, 0);
            
            
            const dayCanceledRevenueResult: Array<{ canceled_revenue: number }> = await prisma.$queryRaw`
              SELECT COALESCE(SUM(oi.amount * oi.price), 0) as canceled_revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.status = 'canceled'
              AND o.updated_at >= ${dayStart}
              AND o.updated_at <= ${dayEnd}
            `;
            
            const revenue = dayRevenue;
            const canceledRevenue = dayCanceledRevenueResult[0]?.canceled_revenue ? parseFloat(dayCanceledRevenueResult[0].canceled_revenue.toString()) : 0;
            
            return {
              month: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
              revenue: revenue,
              canceledRevenue: canceledRevenue,
              orders: dayOrdersCount
            };
          }));
        } else if (groupBy === 'week') {
          // Группировка по неделям
          const weeks = [];
          const currentDate = new Date(start);
          
          while (currentDate <= end) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            if (weekEnd > end) {
              weekEnd.setTime(end.getTime());
            }
            
            weeks.push({ start: new Date(weekStart), end: new Date(weekEnd) });
            currentDate.setDate(currentDate.getDate() + 7);
          }
          
          monthlyRevenue = await Promise.all(weeks.map(async (week) => {
            const weekOrdersCount = await prisma.order.count({
              where: {
                updatedAt: {
                  gte: week.start,
                  lte: week.end
                }
              }
            });
            
            const weekRevenueResult: Array<{ total_revenue: number }> = await prisma.$queryRaw`
              SELECT COALESCE(SUM(oi.amount * oi.price), 0) as total_revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.status = 'delivered'
              AND o.updated_at >= ${week.start}
              AND o.updated_at <= ${week.end}
            `;
            
            const weekCanceledRevenueResult: Array<{ canceled_revenue: number }> = await prisma.$queryRaw`
              SELECT COALESCE(SUM(oi.amount * oi.price), 0) as canceled_revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.status = 'canceled'
              AND o.updated_at >= ${week.start}
              AND o.updated_at <= ${week.end}
            `;
            
            const revenue = weekRevenueResult[0]?.total_revenue ? parseFloat(weekRevenueResult[0].total_revenue.toString()) : 0;
            const canceledRevenue = weekCanceledRevenueResult[0]?.canceled_revenue ? parseFloat(weekCanceledRevenueResult[0].canceled_revenue.toString()) : 0;
            
            return {
              month: `${week.start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}-${week.end.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`,
              revenue: revenue,
              canceledRevenue: canceledRevenue,
              orders: weekOrdersCount
            };
          }));
        } else {
          // Группировка по месяцам
          const months = [];
          const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
          
          while (currentDate <= end) {
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
            
            if (monthEnd > end) {
              monthEnd.setTime(end.getTime());
            }
            
            months.push({ start: new Date(monthStart), end: new Date(monthEnd) });
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          monthlyRevenue = await Promise.all(months.map(async (month) => {
            const monthOrdersCount = await prisma.order.count({
              where: {
                updatedAt: {
                  gte: month.start,
                  lte: month.end
                }
              }
            });
            
            const monthRevenueResult: Array<{ total_revenue: number }> = await prisma.$queryRaw`
              SELECT COALESCE(SUM(oi.amount * oi.price), 0) as total_revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.status = 'delivered'
              AND o.updated_at >= ${month.start}
              AND o.updated_at <= ${month.end}
            `;
            
            const monthCanceledRevenueResult: Array<{ canceled_revenue: number }> = await prisma.$queryRaw`
              SELECT COALESCE(SUM(oi.amount * oi.price), 0) as canceled_revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.status = 'canceled'
              AND o.updated_at >= ${month.start}
              AND o.updated_at <= ${month.end}
            `;
            
            const revenue = monthRevenueResult[0]?.total_revenue ? parseFloat(monthRevenueResult[0].total_revenue.toString()) : 0;
            const canceledRevenue = monthCanceledRevenueResult[0]?.canceled_revenue ? parseFloat(monthCanceledRevenueResult[0].canceled_revenue.toString()) : 0;
            
            const monthNumber = String(month.start.getMonth() + 1).padStart(2, '0');
            const year = month.start.getFullYear();
            
            return {
              month: `${monthNumber}.${year}`,
              revenue: revenue,
              canceledRevenue: canceledRevenue,
              orders: monthOrdersCount
            };
          }));
        }
      } else {
        // Если нет диапазона дат, генерируем данные за последние 7 дней
        const days = getLastNDaysInBishkek(7);
        
        monthlyRevenue = await Promise.all(days.map(async (day) => {
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayOrdersCount = await prisma.order.count({
            where: {
              updatedAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          });
          
          const dayRevenueResult: Array<{ total_revenue: number }> = await prisma.$queryRaw`
            SELECT COALESCE(SUM(oi.amount * oi.price), 0) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'delivered'
            AND o.updated_at >= ${dayStart}
            AND o.updated_at <= ${dayEnd}
          `;
          
          const dayCanceledRevenueResult: Array<{ canceled_revenue: number }> = await prisma.$queryRaw`
            SELECT COALESCE(SUM(oi.amount * oi.price), 0) as canceled_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'canceled'
            AND o.updated_at >= ${dayStart}
            AND o.updated_at <= ${dayEnd}
          `;
          
          const revenue = dayRevenueResult[0]?.total_revenue ? parseFloat(dayRevenueResult[0].total_revenue.toString()) : 0;
          const canceledRevenue = dayCanceledRevenueResult[0]?.canceled_revenue ? parseFloat(dayCanceledRevenueResult[0].canceled_revenue.toString()) : 0;
          
          return {
            month: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            revenue: revenue,
            canceledRevenue: canceledRevenue,
            orders: dayOrdersCount
          };
        }));
      }
      
    } catch (error) {
      // Ошибка получения данных по доходам - создаем пустые данные
      console.error('ERROR in revenue calculation:', error);
      const days = getLastNDaysInBishkek(7);
      
      monthlyRevenue = days.map(day => ({
        month: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        revenue: 0,
        canceledRevenue: 0,
        orders: 0
      }));
    }

    // Генерируем данные по дням для выбранного периода
    try {
      if (dateFrom && dateTo) {
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
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
          
          // Все заказы за день
          const dayOrders = await prisma.order.count({
            where: {
              updatedAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          });
          
          // Только доставленные заказы за день
          const dayDeliveredOrders = await prisma.order.count({
            where: {
              updatedAt: {
                gte: dayStart,
                lte: dayEnd
              },
              status: 'DELIVERED' as const
            }
          });
          
          const dayRevenue = await prisma.orderItem.findMany({
            where: {
              order: {
                updatedAt: {
                  gte: dayStart,
                  lte: dayEnd
                },
                status: 'DELIVERED' as const
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
            deliveredOrders: dayDeliveredOrders,
            revenue: revenue
          };
        }));
      } else {
        // Если нет диапазона дат, генерируем данные за последние 7 дней
        const days = getLastNDaysInBishkek(7);
        
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
          
          const dayDeliveredOrders = await prisma.order.count({
            where: {
              updatedAt: {
                gte: dayStart,
                lte: dayEnd
              },
              status: 'DELIVERED' as const
            }
          });
          
          const dayRevenue = await prisma.orderItem.findMany({
            where: {
              order: {
                updatedAt: {
                  gte: dayStart,
                  lte: dayEnd
                },
                status: 'DELIVERED' as const
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
            deliveredOrders: dayDeliveredOrders,
            revenue: revenue
          };
        }));
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения данных по дням - создаем пустые данные
      const days = getLastNDaysInBishkek(7);
      
      dailyOrders = days.map(day => ({
        date: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        orders: 0,
        deliveredOrders: 0,
        revenue: 0
      }));
    }

    try {
      // Данные по статусам заказов с учетом фильтра по updatedAt
      const statusOrderDateFilter = dateFrom && dateTo ? {
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения данных по статусам заказов
    }

    try {
      // Топ-10 товары по количеству продаж (только доставленные заказы за период)
      const topProductsOrderDateFilter = dateFrom && dateTo ? {
        updatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        },
        status: 'DELIVERED' as const
      } : {
        status: 'DELIVERED' as const
      };
      
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
        take: 10
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
          sold: item._sum?.amount || 0,
          revenue: totalRevenue
        };
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения топ товаров
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
        
        // Считаем общую стоимость всех товаров в категории (не от заказов)
        const totalProductsValue = category.products.reduce((sum, product) => {
          return sum + Number(product.price);
        }, 0);

        return {
          name: category.name,
          products: category.products.length,
          orders: totalOrders,
          revenue: totalProductsValue // Используем стоимость товаров, а не выручку от заказов
        };
      }).sort((a, b) => b.products - a.products) // Сортируем по количеству товаров
        .slice(0, 5); // Берем топ-5 категорий
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ошибка получения данных по категориям
    }

    // Используем реальные данные если есть, иначе демо-данные

    // Если запрашивается только определенная секция, возвращаем только её
    if (section === 'overview') {
      const response = NextResponse.json({
        overview: {
          totalProducts: totalProducts,
          totalOrders: totalOrders,
          totalRevenue: totalRevenue,
          pendingOrders: pendingOrders,
          netRevenue: netRevenue,
          totalCategories: totalCategories,
          activeProducts: activeProducts,
          totalCouriers: totalCouriers,
          totalSellers: totalSellers
        }
      });
      
      // Кэшируем overview на 30 секунд
      response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      return response;
    }

    if (section === 'charts') {
      const response = NextResponse.json({
        charts: {
          // Всегда используем реальные данные, даже если они пустые (0)
          monthlyRevenue: monthlyRevenue,
          topProducts: topProducts,
          categories: categories,
          orderStatus: orderStatus,
          dailyOrders: dailyOrders,
          userStats: userStats,
          courierPerformance: courierPerformance,
          productInsights: productInsights,
          recentActivity: recentActivity
        }
      });
      
      // Кэшируем charts на 2 минуты
      response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return response;
    }

    if (section === 'recentOrders') {
      const response = NextResponse.json({
        recentOrders: recentOrders.length > 0 ? recentOrders.map(order => {
          const totalPrice = order.orderItems.reduce((sum: number, item: { price: number; amount: number }) => {
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
            status: 'DELIVERED' as const,
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
      
      // Кэшируем recent orders на 1 минуту
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return response;
    }

    // Возвращаем все данные если секция не указана (обратная совместимость)
    return NextResponse.json({
      overview: {
        totalProducts: totalProducts, // Всегда реальное значение
        totalOrders: totalOrders, // Всегда реальное значение (может быть 0)
        totalRevenue: totalRevenue, // Всегда реальное значение (может быть 0)
        pendingOrders: pendingOrders, // Всегда реальное значение (может быть 0)
        netRevenue: netRevenue, // Чистая выручка (процент админа)
        totalCategories: totalCategories, // Всегда реальное значение
        activeProducts: activeProducts, // Всегда реальное значение
        totalCouriers: totalCouriers, // Всегда реальное значение
        totalSellers: totalSellers // Всегда реальное значение
      },
      charts: {
        // Всегда используем реальные данные, даже если они пустые (0)
        monthlyRevenue: monthlyRevenue,
        topProducts: topProducts,
        categories: categories,
        orderStatus: orderStatus,
        dailyOrders: dailyOrders,
        userStats: userStats,
        courierPerformance: courierPerformance,
        productInsights: productInsights,
        recentActivity: recentActivity
      },
      recentOrders: recentOrders.length > 0 ? recentOrders.map(order => {
        // Подсчитываем общую стоимость заказа через orderItems
        const totalPrice = order.orderItems.reduce((sum: number, item: { price: number; amount: number }) => {
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
          status: 'DELIVERED' as const,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // Общая ошибка API дашборда
    
    // Возвращаем безопасные значения в случае любой ошибки
    return NextResponse.json({
      overview: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0, // Не используем демо-данные для дохода
        pendingOrders: 0,
        netRevenue: 0, // Чистая выручка
        totalCategories: 0,
        activeProducts: 0,
        totalCouriers: 0,
        totalSellers: 0
      },
      charts: {
        monthlyRevenue: [
          { month: 'Янв', revenue: 45000, canceledRevenue: 5000, orders: 12 },
          { month: 'Фев', revenue: 52000, canceledRevenue: 3000, orders: 15 },
          { month: 'Мар', revenue: 48000, canceledRevenue: 7000, orders: 14 },
          { month: 'Апр', revenue: 61000, canceledRevenue: 4000, orders: 18 },
          { month: 'Май', revenue: 55000, canceledRevenue: 6000, orders: 16 },
          { month: 'Июн', revenue: 67000, canceledRevenue: 2000, orders: 20 }
        ],
        topProducts: [
          { name: 'Платье летнее', sold: 45, revenue: 67500 },
          { name: 'Блузка классическая', sold: 32, revenue: 48000 },
          { name: 'Юбка мини', sold: 28, revenue: 42000 },
          { name: 'Джинсы прямые', sold: 24, revenue: 36000 },
          { name: 'Топ базовый', sold: 20, revenue: 30000 },
          { name: 'Кардиган теплый', sold: 18, revenue: 27000 },
          { name: 'Брюки классические', sold: 15, revenue: 22500 },
          { name: 'Свитер вязаный', sold: 12, revenue: 18000 },
          { name: 'Рубашка белая', sold: 10, revenue: 15000 },
          { name: 'Шорты джинсовые', sold: 8, revenue: 12000 }
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
          { date: '01.12', orders: 3, deliveredOrders: 2, revenue: 9000 },
          { date: '02.12', orders: 5, deliveredOrders: 4, revenue: 15000 },
          { date: '03.12', orders: 2, deliveredOrders: 1, revenue: 6000 },
          { date: '04.12', orders: 7, deliveredOrders: 6, revenue: 21000 },
          { date: '05.12', orders: 4, deliveredOrders: 3, revenue: 12000 },
          { date: '06.12', orders: 6, deliveredOrders: 5, revenue: 18000 },
          { date: '07.12', orders: 8, deliveredOrders: 7, revenue: 24000 }
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
  }
}