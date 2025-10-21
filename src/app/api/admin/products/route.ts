import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBishkekTimeAsUTC } from '@/lib/timezone';

// GET - получить товары с пагинацией
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Параметры пагинации
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Параметры фильтрации
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const color = searchParams.get('color') || '';
    const size = searchParams.get('size') || '';
    const sellerId = searchParams.get('sellerId') || '';
    const status = searchParams.get('status') || '';
    
    // Параметры сортировки
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Строим условия фильтрации
    const where: Record<string, unknown> = {};
    
    // Поиск по названию и описанию
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Фильтр по категории
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Фильтр по статусу
    if (status) {
      where.status = status;
    }
    
    // Фильтр по продавцу
    if (sellerId) {
      where.sellerId = sellerId;
    }
    
    // Фильтр по размеру
    if (size) {
      where.productSizes = {
        some: {
          size: {
            name: size
          }
        }
      };
    }
    
    // Фильтр по цвету
    if (color) {
      where.productColors = {
        some: {
          color: {
            name: color
          }
        }
      };
    }
    
    // Строим параметры сортировки
    const orderBy: Record<string, unknown> = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'category':
        orderBy.category = { name: sortOrder };
        break;
      case 'status':
        orderBy.status = sortOrder;
        break;
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder;
        break;
    }
    
    // Получаем общее количество товаров для пагинации
    const totalCount = await prisma.product.count({ where });
    
    // Получаем товары с пагинацией
    const products = await prisma.product.findMany({
      where,
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
        },
        productSizes: {
          include: {
            size: true
          }
        },
        productColors: {
          include: {
            color: {
              select: {
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
    });

    // Преобразуем данные для фронтенда в соответствии с новой схемой
    const transformedProducts = products.map((product) => {
      // Получаем главное изображение из JSON поля
      let mainImage = null;
      if (product.imageUrl && Array.isArray(product.imageUrl)) {
        mainImage = product.imageUrl[0] || null;
      }

      return {
        id: product.id.trim(),
        name: product.name,
        description: product.description,
        price: Number(product.price),
        categoryId: product.categoryId.trim(),
        status: product.status,
        category: {
          id: product.category.id.trim(),
          name: product.category.name
        },
        seller: {
          id: product.seller.id.trim(),
          fullname: product.seller.fullname
        },
        mainImage,
        imageUrl: product.imageUrl,
        attributes: product.attributes,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        // Для совместимости с фронтендом
        isActive: product.status === 'ACTIVE',
        variantsCount: 1, // простые товары = 1 вариант
        totalQuantity: 1, // заглушка для количества
        minPrice: Number(product.price),
        maxPrice: Number(product.price),
        variants: 1,
        images: Array.isArray(product.imageUrl) ? product.imageUrl.length : 0,
        sizes: product.productSizes.map((ps: { size: { name: string } }) => ps.size.name),
        colors: product.productColors.map((pc: { color: { name: string; colorCode: string } }) => ({
          name: pc.color.name,
          colorCode: pc.color.colorCode
        }))
      };
    });
    
    // Вычисляем информацию о пагинации
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения товаров', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - создать новый товар
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, categoryId, price, sellerId, status = 'ACTIVE', imageUrl = [], attributes = {}, sizes = [], colors = [] } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название товара обязательно' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Категория товара обязательна' },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Цена товара обязательна и должна быть больше 0' },
        { status: 400 }
      );
    }

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Продавец обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что категория существует
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 400 }
      );
    }

    // Проверяем, что продавец существует
    const seller = await prisma.user.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Продавец не найден' },
        { status: 400 }
      );
    }

    // Создаем товар в транзакции с увеличенным таймаутом
    const result = await prisma.$transaction(async (tx) => {
      // Создаем товар с правильным временем для Бишкека
      const bishkekTime = getBishkekTimeAsUTC();
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          categoryId,
          sellerId,
          status: status as 'ACTIVE' | 'INACTIVE' | 'DELETED',
          price: parseFloat(price.toString()),
          imageUrl: Array.isArray(imageUrl) ? imageUrl : [],
          attributes: attributes || {},
          createdAt: bishkekTime,
          updatedAt: bishkekTime
        }
      });

      // Оптимизированное добавление размеров
      if (sizes && sizes.length > 0) {
        const uniqueSizes = [...new Set(sizes.map((s: string) => s.trim()))];
        
        // Находим существующие размеры одним запросом
        const existingSizes = await tx.size.findMany({
          where: { 
            name: { in: uniqueSizes as string[] }
          }
        });

        const existingSizeNames = existingSizes.map((s: { name: string }) => s.name);
        const sizesToCreate = uniqueSizes.filter((name): name is string => 
          typeof name === 'string' && !existingSizeNames.includes(name)
        );

        // Создаем недостающие размеры одним запросом
        if (sizesToCreate.length > 0) {
          await tx.size.createMany({
            data: sizesToCreate.map(name => ({ name: name as string })),
            skipDuplicates: true
          });
        }

        // Получаем все размеры (включая только что созданные)
        const allSizes = await tx.size.findMany({
          where: { name: { in: uniqueSizes as string[] } }
        });

        // Создаем связи одним запросом
        await tx.productSize.createMany({
          data: allSizes.map((size: { id: string }) => ({
            productId: product.id,
            sizeId: size.id
          })),
          skipDuplicates: true
        });
      }

      // Оптимизированное добавление цветов
      if (colors && colors.length > 0) {
        const uniqueColors = [...new Set(colors.map((c: string) => c.trim()))];
        
        // Находим существующие цвета одним запросом
        const existingColors = await tx.color.findMany({
          where: { 
            name: { in: uniqueColors as string[] }
          }
        });

        const existingColorNames = existingColors.map((c: { name: string }) => c.name);
        const colorsToCreate = uniqueColors.filter((name): name is string => 
          typeof name === 'string' && !existingColorNames.includes(name)
        );

        // Создаем недостающие цвета одним запросом
        if (colorsToCreate.length > 0) {
          await tx.color.createMany({
            data: colorsToCreate.map(name => ({ 
              name: name as string,
              colorCode: '#000000' // Значение по умолчанию
            })),
            skipDuplicates: true
          });
        }

        // Получаем все цвета (включая только что созданные)
        const allColors = await tx.color.findMany({
          where: { name: { in: uniqueColors as string[] } }
        });

        // Создаем связи одним запросом
        await tx.productColor.createMany({
          data: allColors.map((color: { id: string }) => ({
            productId: product.id,
            colorId: color.id
          })),
          skipDuplicates: true
        });
      }

      // Возвращаем созданный товар с полными данными
      return await tx.product.findUnique({
        where: { id: product.id },
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
          },
          productSizes: {
            include: {
              size: true
            }
          },
          productColors: {
            include: {
              color: {
                select: {
                  name: true,
                  colorCode: true
                }
              }
            }
          }
        }
      });
    }, {
      timeout: 15000 // Увеличиваем таймаут до 15 секунд
    });

    // Преобразуем данные для ответа
    const transformedProduct = {
      id: result!.id.trim(),
      name: result!.name,
      description: result!.description,
      price: Number(result!.price),
      categoryId: result!.categoryId.trim(),
      status: result!.status,
      category: {
        id: result!.category.id.trim(),
        name: result!.category.name
      },
      seller: {
        id: result!.seller.id.trim(),
        fullname: result!.seller.fullname
      },
      mainImage: Array.isArray(result!.imageUrl) && result!.imageUrl.length > 0 ? result!.imageUrl[0] : null,
      imageUrl: result!.imageUrl,
      attributes: result!.attributes,
      createdAt: result!.createdAt.toISOString(),
      updatedAt: result!.updatedAt.toISOString(),
      // Для совместимости с фронтендом
      isActive: result!.status === 'ACTIVE',
      variantsCount: 1,
      totalQuantity: 1,
      minPrice: Number(result!.price),
      maxPrice: Number(result!.price),
      variants: 1,
      images: Array.isArray(result!.imageUrl) ? result!.imageUrl.length : 0,
      sizes: result!.productSizes.map((ps: { size: { name: string } }) => ps.size.name),
      colors: result!.productColors.map((pc: { color: { name: string; colorCode: string } }) => ({
        name: pc.color.name,
        colorCode: pc.color.colorCode
      }))
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
