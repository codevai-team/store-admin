import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все категории
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'alphabetical';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    let categories;

    if (sortBy === 'popular') {
      // Для сортировки по популярности используем агрегацию через OrderItem
      categories = await prisma.category.findMany({
        include: {
          parentCategory: true,
          subCategories: true,
          products: {
            select: {
              id: true,
              orderItems: {
                select: {
                  amount: true
                }
              }
            }
          }
        },
        orderBy: [
          { categoryId: 'asc' }, // Родительские категории сначала
          { name: 'asc' }
        ]
      });

      // Вычисляем популярность для каждой категории
      const categoriesWithPopularity = categories.map(category => {
        const totalSales = category.products.reduce((sum, product) => {
          return sum + product.orderItems.reduce((productSum, orderItem) => productSum + orderItem.amount, 0);
        }, 0);

        return {
          ...category,
          totalSales
        };
      });

      // Сортируем по популярности
      categoriesWithPopularity.sort((a, b) => {
        return sortOrder === 'desc' ? b.totalSales - a.totalSales : a.totalSales - b.totalSales;
      });

      categories = categoriesWithPopularity;
    } else {
      // Определяем порядок сортировки для обычных сортировок
      let orderByClause;
      
      switch (sortBy) {
        case 'alphabetical':
          orderByClause = [
            { categoryId: 'asc' }, // Родительские категории сначала
            { name: sortOrder === 'desc' ? 'desc' : 'asc' }
          ];
          break;
        case 'products':
          // Для сортировки по количеству товаров нужно сначала загрузить, потом отсортировать
          orderByClause = [
            { categoryId: 'asc' },
            { name: 'asc' }
          ];
          break;
        default:
          orderByClause = [
            { categoryId: 'asc' },
            { name: 'asc' }
          ];
      }

      categories = await prisma.category.findMany({
        include: {
          parentCategory: true,
          subCategories: true,
          products: {
            select: {
              id: true
            }
          }
        },
        orderBy: orderByClause
      });

      // Если сортировка по количеству товаров, применяем клиентскую сортировку
      if (sortBy === 'products') {
        categories.sort((a, b) => {
          const comparison = b.products.length - a.products.length;
          return sortOrder === 'asc' ? -comparison : comparison;
        });
      }
    }

    // Преобразуем для совместимости с фронтендом
    const categoriesWithStats = categories.map(category => ({
      id: category.id.trim(),
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.categoryId?.trim() || null,
      categoryId: category.categoryId?.trim() || null,
      parent: category.parentCategory ? {
        id: category.parentCategory.id.trim(),
        name: category.parentCategory.name
      } : null,
      children: category.subCategories,
      productsCount: category.products.length,
      childrenCount: category.subCategories.length,
      // Добавляем информацию о продажах для популярности
      ...(sortBy === 'popular' && 'totalSales' in category ? { totalSales: category.totalSales } : {})
    }));

    return NextResponse.json(categoriesWithStats);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения категорий' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - создать новую категорию
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, parentId, imageUrl } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      );
    }

    // Проверяем, что родительская категория существует
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Родительская категория не найдена' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        categoryId: parentId || null, // используем categoryId вместо parentId
        imageUrl: imageUrl?.trim() || null
      },
      include: {
        parentCategory: true,
        subCategories: true,
        products: {
          select: {
            id: true
          }
        }
      }
    });

    return NextResponse.json({
      id: category.id.trim(),
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.categoryId?.trim() || null, // для совместимости с фронтендом
      categoryId: category.categoryId?.trim() || null,
      parent: category.parentCategory ? {
        id: category.parentCategory.id.trim(),
        name: category.parentCategory.name
      } : null,
      children: category.subCategories,
      productsCount: category.products.length,
      childrenCount: category.subCategories.length
    });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания категории' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
