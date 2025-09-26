import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все категории
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parentCategory: true,
        subCategories: true,
        products: {
          select: {
            id: true
          }
        }
      },
      orderBy: [
        { categoryId: 'asc' }, // Родительские категории сначала (null значения будут первыми)
        { name: 'asc' }
      ]
    });

    // Преобразуем для совместимости с фронтендом
    const categoriesWithStats = categories.map(category => ({
      id: category.id.trim(),
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.categoryId?.trim() || null, // преобразуем categoryId в parentId для совместимости
      categoryId: category.categoryId?.trim() || null,
      parent: category.parentCategory ? {
        id: category.parentCategory.id.trim(),
        name: category.parentCategory.name
      } : null,
      children: category.subCategories,
      productsCount: category.products.length,
      childrenCount: category.subCategories.length
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
