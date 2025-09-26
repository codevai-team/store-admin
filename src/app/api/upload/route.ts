import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// Инициализация S3 клиента
const s3Client = new S3Client({
  endpoint: process.env.S3_URL,
  region: 'auto', // Для совместимости с S3-совместимыми хранилищами
  credentials: {
    accessKeyId: process.env.PICTURES_TRIAL_TEST_BUCKET_S3_ACCESS_KEY!,
    secretAccessKey: process.env.PICTURES_TRIAL_TEST_BUCKET_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Необходимо для некоторых S3-совместимых сервисов
});

const BUCKET_NAME = process.env.PICTURES_TRIAL_TEST_BUCKET!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Можно загружать только изображения' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 10MB' },
        { status: 400 }
      );
    }

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop();
    const fileName = `products/${randomUUID()}.${fileExtension}`;

    // Конвертируем файл в Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загружаем файл в S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Делаем файл публично доступным
    });

    await s3Client.send(uploadCommand);

    // Формируем URL загруженного файла
    const fileUrl = `${process.env.S3_URL}/${BUCKET_NAME}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('S3 Upload Error:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки файла', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Удаление файла из S3
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('fileUrl');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'URL файла не указан' },
        { status: 400 }
      );
    }

    // Извлекаем путь к файлу из полного URL
    const fileName = extractFileNameFromUrl(fileUrl);
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'Некорректный URL файла' },
        { status: 400 }
      );
    }

    // Команда удаления
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    
    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'Файл удален'
    });

  } catch (error) {
    console.error('S3 Delete Error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления файла', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Функция для извлечения имени файла из URL
function extractFileNameFromUrl(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    // Ожидаем формат: /bucket-name/products/filename.ext
    if (pathParts.length >= 3 && pathParts[2] === 'products') {
      return `products/${pathParts[3]}`;
    }
    return null;
  } catch {
    return null;
  }
}