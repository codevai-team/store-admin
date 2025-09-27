import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - обновить категорию
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { name, parentId, imageUrl, description } = body;
    const { id } = await params;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      );
    }

    // Проверяем, что категория существует
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, что не пытаемся сделать категорию потомком самой себя
    if (parentId === id) {
      return NextResponse.json(
        { error: 'Категория не может быть родителем самой себе' },
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

      // Проверяем, что не создаем циклическую зависимость
      const checkCycle = async (categoryId: string, targetParentId: string): Promise<boolean> => {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          include: { parentCategory: true }
        });

        if (!category?.parentCategory) return false;
        if (category.parentCategory.id === targetParentId) return true;
        
        return await checkCycle(category.parentCategory.id, targetParentId);
      };

      const hasCycle = await checkCycle(parentId, id);
      if (hasCycle) {
        return NextResponse.json(
          { error: 'Нельзя создать циклическую зависимость' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        categoryId: parentId || null,
        imageUrl: imageUrl || null,
        description: description || null
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
      parentId: category.categoryId?.trim() || null,
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
    console.error('Categories PUT error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления категории' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - удалить категорию
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем, что категория существует
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: true,
        products: true
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли товары в категории
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить категорию с товарами' },
        { status: 400 }
      );
    }

    // Проверяем, есть ли дочерние категории
    if (existingCategory.subCategories.length > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить категорию с подкategories' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления категории' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
