import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем всех пользователей с ролью COURIER
    const couriers = await prisma.user.findMany({
      where: {
        role: 'COURIER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        fullname: true,
        phoneNumber: true
      },
      orderBy: {
        fullname: 'asc'
      }
    });

    return NextResponse.json(couriers);

  } catch (error) {
    console.error('Error fetching couriers:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки курьеров' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
