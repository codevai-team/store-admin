import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

type ProductWithIncludes = {
  id: string;
  name: string;
  description: string | null;
  price: any;
  categoryId: string;
  sellerId: string;
  imageUrl: any;
  attributes: any;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
  seller: {
    id: string;
    fullname: string;
  };
  productSizes: Array<{
    size: {
      name: string;
    };
  }>;
  productColors: Array<{
    color: {
      name: string;
      colorCode: string;
    };
  }>;
};

const prisma = new PrismaClient();

// GET - получить все товары
export async function GET() {
  try {
    const products = await prisma.product.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Преобразуем данные для фронтенда в соответствии с новой схемой
    const transformedProducts = products.map((product: ProductWithIncludes) => {
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
        isActive: true, // в новой схеме нет поля isActive, считаем все активными
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
    
    return NextResponse.json(transformedProducts);
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
    const { name, description, categoryId, price, sellerId, imageUrl = [], attributes = {}, sizes = [], colors = [] } = body;

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
    const result = await prisma.$transaction(async (tx: any) => {
      // Создаем товар
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          categoryId,
          sellerId,
          price: parseFloat(price.toString()),
          imageUrl: Array.isArray(imageUrl) ? imageUrl : [],
          attributes: attributes || {}
        }
      });

      // Оптимизированное добавление размеров
      if (sizes && sizes.length > 0) {
        const uniqueSizes = [...new Set(sizes.map((s: string) => s.trim()))];
        
        // Находим существующие размеры одним запросом
        const existingSizes = await tx.size.findMany({
          where: { 
            name: { in: uniqueSizes }
          }
        });

        const existingSizeNames = existingSizes.map((s: any) => s.name);
        const sizesToCreate = uniqueSizes.filter(name => !existingSizeNames.includes(name));

        // Создаем недостающие размеры одним запросом
        if (sizesToCreate.length > 0) {
          await tx.size.createMany({
            data: sizesToCreate.map(name => ({ name })),
            skipDuplicates: true
          });
        }

        // Получаем все размеры (включая только что созданные)
        const allSizes = await tx.size.findMany({
          where: { name: { in: uniqueSizes } }
        });

        // Создаем связи одним запросом
        await tx.productSize.createMany({
          data: allSizes.map((size: any) => ({
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
            name: { in: uniqueColors }
          }
        });

        const existingColorNames = existingColors.map((c: any) => c.name);
        const colorsToCreate = uniqueColors.filter(name => !existingColorNames.includes(name));

        // Создаем недостающие цвета одним запросом
        if (colorsToCreate.length > 0) {
          await tx.color.createMany({
            data: colorsToCreate.map(name => ({ name })),
            skipDuplicates: true
          });
        }

        // Получаем все цвета (включая только что созданные)
        const allColors = await tx.color.findMany({
          where: { name: { in: uniqueColors } }
        });

        // Создаем связи одним запросом
        await tx.productColor.createMany({
          data: allColors.map((color: any) => ({
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
      isActive: true,
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
