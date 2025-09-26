import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все цвета
export async function GET() {
  try {
    const colors = await prisma.color.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(colors);
  } catch (error) {
    console.error('Colors GET error:', error);
    
    // Fallback к статическим данным при недоступности БД
    const fallbackColors = [
      { id: 'color-1', name: 'Белый', colorCode: '#FFFFFF' },
      { id: 'color-2', name: 'Черный', colorCode: '#000000' },
      { id: 'color-3', name: 'Красный', colorCode: '#FF0000' },
      { id: 'color-4', name: 'Синий', colorCode: '#0000FF' },
      { id: 'color-5', name: 'Зеленый', colorCode: '#00FF00' },
      { id: 'color-6', name: 'Желтый', colorCode: '#FFFF00' },
      { id: 'color-7', name: 'Серый', colorCode: '#808080' },
      { id: 'color-8', name: 'Коричневый', colorCode: '#8B4513' },
      { id: 'color-9', name: 'Розовый', colorCode: '#FFC0CB' },
      { id: 'color-10', name: 'Фиолетовый', colorCode: '#800080' }
    ];
    
    return NextResponse.json(fallbackColors);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors in fallback mode
    }
  }
}

// POST - создать новый цвет
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, colorCode } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название цвета обязательно' },
        { status: 400 }
      );
    }

    if (!colorCode?.trim()) {
      return NextResponse.json(
        { error: 'Код цвета обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что цвет не существует
    const existingColor = await prisma.color.findFirst({
      where: { 
        OR: [
          { name: name.trim() },
          { colorCode: colorCode.trim() }
        ]
      }
    });

    if (existingColor) {
      return NextResponse.json(
        { error: 'Цвет с таким названием или кодом уже существует' },
        { status: 400 }
      );
    }

    const color = await prisma.color.create({
      data: {
        name: name.trim(),
        colorCode: colorCode.trim()
      }
    });

    return NextResponse.json(color);
  } catch (error) {
    console.error('Colors POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания цвета', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
