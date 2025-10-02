import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim();

    // Параллельный поиск по всем сущностям
    const [products, orders, users, categories, settings] = await Promise.all([
      // Поиск продуктов
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { id: { contains: searchTerm, mode: 'insensitive' } }
          ],
          status: 'ACTIVE'
        },
        include: {
          category: { select: { name: true } },
          seller: { select: { fullname: true } }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),

      // Поиск заказов
      prisma.order.findMany({
        where: {
          OR: [
            { id: { contains: searchTerm, mode: 'insensitive' } },
            { customerName: { contains: searchTerm, mode: 'insensitive' } },
            { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
            { deliveryAddress: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          courier: { select: { fullname: true } }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),

      // Поиск пользователей (сотрудники)
      prisma.user.findMany({
        where: {
          OR: [
            { fullname: { contains: searchTerm, mode: 'insensitive' } },
            { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
            { id: { contains: searchTerm, mode: 'insensitive' } }
          ],
          status: 'ACTIVE'
        },
        select: {
          id: true,
          fullname: true,
          phoneNumber: true,
          role: true,
          createdAt: true
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),

      // Поиск категорий
      prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { id: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          parentCategory: { select: { name: true } },
          _count: { select: { products: true } }
        },
        take: limit,
        orderBy: { name: 'asc' }
      }),

      // Поиск настроек
      prisma.setting.findMany({
        where: {
          OR: [
            { key: { contains: searchTerm, mode: 'insensitive' } },
            { value: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { key: 'asc' }
      })
    ]);

    // Форматируем результаты для фронтенда
    const results = [
      ...products.map(product => {
        // Получаем главное изображение из JSON поля
        let mainImage = null;
        if (product.imageUrl && Array.isArray(product.imageUrl) && product.imageUrl.length > 0) {
          mainImage = product.imageUrl[0];
        }
        
        return {
          id: product.id,
          type: 'product' as const,
          title: product.name,
          subtitle: `${product.category.name} • ${product.seller.fullname}`,
          description: product.description || '',
          price: product.price.toString(),
          url: `/admin/products?view=${product.id}`,
          icon: 'CubeIcon',
          image: mainImage // Добавляем изображение товара
        };
      }),

      ...orders.map(order => ({
        id: order.id,
        type: 'order' as const,
        title: `Заказ #${order.id.slice(-8)}`,
        subtitle: order.customerName,
        description: `${order.customerPhone} • ${order.deliveryAddress}`,
        status: order.status,
        url: `/admin/orders?view=${order.id}`,
        icon: 'ClipboardDocumentListIcon'
      })),

      ...users.map(user => ({
        id: user.id,
        type: 'user' as const,
        title: user.fullname,
        subtitle: getRoleLabel(user.role),
        description: user.phoneNumber,
        role: user.role,
        url: `/admin/staff?view=${user.id}`,
        icon: user.role === 'ADMIN' ? 'ShieldCheckIcon' : user.role === 'COURIER' ? 'TruckIcon' : 'UserIcon'
      })),

      ...categories.map(category => ({
        id: category.id,
        type: 'category' as const,
        title: category.name,
        subtitle: category.parentCategory ? `Подкатегория • ${category.parentCategory.name}` : 'Основная категория',
        description: category.description || `${category._count.products} товаров`,
        url: `/admin/categories?view=${category.id}`,
        icon: 'TagIcon',
        image: category.imageUrl // Добавляем изображение категории
      })),

      ...settings.map(setting => ({
        id: setting.id,
        type: 'setting' as const,
        title: setting.key,
        subtitle: 'Настройка системы',
        description: setting.value.length > 50 ? setting.value.slice(0, 50) + '...' : setting.value,
        url: `/admin/settings`,
        icon: 'Cog6ToothIcon'
      }))
    ];

    // Сортируем по релевантности (точные совпадения в начале)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      const bExact = b.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return 0;
    });

    return NextResponse.json({
      results: sortedResults.slice(0, limit),
      total: sortedResults.length,
      query: searchTerm
    });

  } catch (error) {
    console.error('Ошибка поиска:', error);
    return NextResponse.json(
      { error: 'Ошибка при выполнении поиска' },
      { status: 500 }
    );
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Администратор';
    case 'COURIER':
      return 'Курьер';
    case 'SELLER':
      return 'Продавец';
    default:
      return 'Пользователь';
  }
}
