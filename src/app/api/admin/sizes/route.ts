import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все размеры
export async function GET() {
  try {
    const sizes = await prisma.size.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(sizes);
  } catch (error) {
    console.error('Sizes GET error:', error);
    
    // Fallback к статическим данным при недоступности БД
    const fallbackSizes = [
      { id: 'size-1', name: 'XS' },
      { id: 'size-2', name: 'S' },
      { id: 'size-3', name: 'M' },
      { id: 'size-4', name: 'L' },
      { id: 'size-5', name: 'XL' },
      { id: 'size-6', name: 'XXL' },
      { id: 'size-7', name: '28' },
      { id: 'size-8', name: '30' },
      { id: 'size-9', name: '32' },
      { id: 'size-10', name: '34' },
      { id: 'size-11', name: '36' }
    ];
    
    return NextResponse.json(fallbackSizes);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors in fallback mode
    }
  }
}

// POST - создать новый размер
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название размера обязательно' },
        { status: 400 }
      );
    }

    // Проверяем, что размер не существует
    const existingSize = await prisma.size.findFirst({
      where: { name: name.trim() }
    });

    if (existingSize) {
      return NextResponse.json(
        { error: 'Размер с таким названием уже существует' },
        { status: 400 }
      );
    }

    const size = await prisma.size.create({
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json(size);
  } catch (error) {
    console.error('Sizes POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания размера', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
