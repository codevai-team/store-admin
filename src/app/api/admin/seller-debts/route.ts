import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sellerId = searchParams.get('sellerId'); // Добавляем фильтр по продавцу
    
    // Создаем фильтр по датам для заказов
    const dateFilter = dateFrom && dateTo ? {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    } : {};

    // Создаем фильтр по продавцу для orderItems
    const sellerFilter = sellerId ? {
      orderItems: {
        some: {
          product: {
            sellerId: sellerId
          }
        }
      }
    } : {};

    // Получаем все доставленные заказы с товарами и продавцами
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        ...dateFilter,
        ...sellerFilter
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

    // Рассчитываем долги продавцам
    const sellerDebtMap = new Map<string, {
      sellerName: string;
      totalDebt: number;
      commissionRate: number;
      totalRevenue: number;
      adminProfit: number; // Добавляем прибыль админа
      ordersCount: number;
    }>();

    deliveredOrders.forEach(order => {
      // Фильтруем orderItems по выбранному продавцу, если он указан
      const filteredItems = sellerId 
        ? order.orderItems.filter(item => item.product.sellerId === sellerId)
        : order.orderItems;
        
      filteredItems.forEach(item => {
        const itemTotal = Number(item.price) * item.amount;
        const sellerCommission = Number(item.product.seller.commissions[0]?.rate || 0);
        const adminPercentage = sellerCommission / 100;
        
        // Базовая цена продавца = itemTotal / (1 + adminPercentage)
        // Например: 1100 / (1 + 0.1) = 1100 / 1.1 = 1000
        const basePrice = adminPercentage > 0 
          ? itemTotal / (1 + adminPercentage)
          : itemTotal;
        
        // Прибыль админа = itemTotal - basePrice
        const adminProfitFromItem = itemTotal - basePrice;

        const sellerId = item.product.seller.id;
        const sellerName = item.product.seller.fullname;

        if (sellerDebtMap.has(sellerId)) {
          const existing = sellerDebtMap.get(sellerId)!;
          existing.totalDebt += basePrice;
          existing.totalRevenue += itemTotal;
          existing.adminProfit += adminProfitFromItem;
        } else {
          sellerDebtMap.set(sellerId, {
            sellerName,
            totalDebt: basePrice,
            commissionRate: sellerCommission,
            totalRevenue: itemTotal,
            adminProfit: adminProfitFromItem,
            ordersCount: 1
          });
        }
      });
    });

    // Подсчитываем количество заказов для каждого продавца
    const sellerOrderCounts = new Map<string, number>();
    deliveredOrders.forEach(order => {
      const sellersInOrder = new Set<string>();
      order.orderItems.forEach(item => {
        sellersInOrder.add(item.product.seller.id);
      });
      sellersInOrder.forEach(sellerId => {
        sellerOrderCounts.set(sellerId, (sellerOrderCounts.get(sellerId) || 0) + 1);
      });
    });

    // Преобразуем Map в массив с дополнительной информацией
    const sellerDebts = Array.from(sellerDebtMap.entries()).map(([sellerId, data]) => ({
      sellerId,
      sellerName: data.sellerName,
      totalDebt: Math.round(data.totalDebt * 100) / 100,
      totalRevenue: Math.round(data.totalRevenue * 100) / 100,
      adminProfit: Math.round(data.adminProfit * 100) / 100, // Используем правильно рассчитанную прибыль
      commissionRate: data.commissionRate,
      ordersCount: sellerOrderCounts.get(sellerId) || 0
    }));

    // Сортируем по убыванию долга
    sellerDebts.sort((a, b) => b.totalDebt - a.totalDebt);

    return NextResponse.json({
      sellerDebts,
      summary: {
        totalDebt: Math.round(sellerDebts.reduce((sum, debt) => sum + debt.totalDebt, 0) * 100) / 100,
        totalRevenue: Math.round(sellerDebts.reduce((sum, debt) => sum + debt.totalRevenue, 0) * 100) / 100,
        totalAdminProfit: Math.round(sellerDebts.reduce((sum, debt) => sum + debt.adminProfit, 0) * 100) / 100,
        sellersCount: sellerDebts.length,
        ordersCount: deliveredOrders.length
      }
    });

  } catch (error) {
    console.error('Seller debts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch seller debts' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

