import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Выход выполнен успешно' },
    { status: 200 }
  );

  // Удаляем куки
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Устанавливаем время жизни 0 для удаления куки
  });

  return response;
}
