import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить список продавцов
export async function GET() {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SELLER']
        }
      },
      select: {
        id: true,
        fullname: true,
        role: true
      },
      orderBy: {
        fullname: 'asc'
      }
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Ошибка получения продавцов' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
