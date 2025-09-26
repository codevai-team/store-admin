import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - обновить категорию
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, parentId } = body;
    const { id } = params;

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
          include: { parent: true }
        });

        if (!category?.parent) return false;
        if (category.parent.id === targetParentId) return true;
        
        return await checkCycle(category.parent.id, targetParentId);
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
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true
          }
        }
      }
    });

    return NextResponse.json({
      ...category,
      productsCount: category.products.length,
      childrenCount: category.children.length
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Проверяем, что категория существует
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
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
    if (existingCategory.children.length > 0) {
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
