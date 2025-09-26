import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить товар по ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
            color: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Преобразуем данные для фронтенда
    const transformedProduct = {
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
      imageUrl: product.imageUrl,
      attributes: product.attributes,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      sizes: product.productSizes.map(ps => ps.size.name),
      colors: product.productColors.map(pc => pc.color.name),
      // Для совместимости с фронтендом
      isActive: product.status === 'ACTIVE'
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - обновить товар
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, categoryId, price, sellerId, status, imageUrl = [], attributes = {}, sizes = [], colors = [] } = body;

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

    // Проверяем, что товар существует
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
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

    const result = await prisma.$transaction(async (tx) => {
      // Обновляем основные данные товара
      const updateData: any = {
        name: name.trim(),
        description: description?.trim() || null,
        categoryId,
        sellerId,
        price: parseFloat(price.toString()),
        imageUrl: Array.isArray(imageUrl) ? imageUrl : [],
        attributes: attributes || {}
      };

      // Добавляем статус, если он передан
      if (status !== undefined) {
        updateData.status = status as 'ACTIVE' | 'INACTIVE' | 'DELETED';
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: updateData
      });

      // Удаляем старые связи с размерами и цветами
      await tx.productSize.deleteMany({
        where: { productId: id }
      });

      await tx.productColor.deleteMany({
        where: { productId: id }
      });

      // Добавляем новые размеры
      if (sizes && sizes.length > 0) {
        for (const sizeName of sizes) {
          // Находим или создаем размер
          let size = await tx.size.findFirst({
            where: { name: sizeName.trim() }
          });

          if (!size) {
            size = await tx.size.create({
              data: { name: sizeName.trim() }
            });
          }

          // Связываем товар с размером
          await tx.productSize.create({
            data: {
              productId: id,
              sizeId: size.id
            }
          });
        }
      }

      // Добавляем новые цвета
      if (colors && colors.length > 0) {
        for (const colorName of colors) {
          // Находим или создаем цвет
          let color = await tx.color.findFirst({
            where: { name: colorName.trim() }
          });

          if (!color) {
            color = await tx.color.create({
              data: { name: colorName.trim() }
            });
          }

          // Связываем товар с цветом
          await tx.productColor.create({
            data: {
              productId: id,
              colorId: color.id
            }
          });
        }
      }

      // Возвращаем обновленный товар с полными данными
      return await tx.product.findUnique({
        where: { id },
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
              color: true
            }
          }
        }
      });
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
      sizes: result!.productSizes.map(ps => ps.size.name),
      colors: result!.productColors.map(pc => pc.color.name)
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - удалить товар
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем, что товар существует
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Удаляем связи с размерами
      await tx.productSize.deleteMany({
        where: { productId: id }
      });

      // Удаляем связи с цветами
      await tx.productColor.deleteMany({
        where: { productId: id }
      });

      // Удаляем товар
      await tx.product.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
