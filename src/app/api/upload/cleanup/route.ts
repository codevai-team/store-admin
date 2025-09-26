import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Инициализация S3 клиента
const s3Client = new S3Client({
  endpoint: process.env.S3_URL,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.PICTURES_TRIAL_TEST_BUCKET_S3_ACCESS_KEY!,
    secretAccessKey: process.env.PICTURES_TRIAL_TEST_BUCKET_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.PICTURES_TRIAL_TEST_BUCKET!;

// Функция для извлечения ключа из URL
function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Убираем первый пустой элемент и название bucket
    pathParts.shift(); // убираем ""
    pathParts.shift(); // убираем bucket name
    return pathParts.join('/');
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urlsToKeep, urlsToDelete } = await request.json();

    if (!urlsToKeep || !Array.isArray(urlsToKeep)) {
      return NextResponse.json(
        { error: 'urlsToKeep должен быть массивом' },
        { status: 400 }
      );
    }

    if (!urlsToDelete || !Array.isArray(urlsToDelete)) {
      return NextResponse.json(
        { error: 'urlsToDelete должен быть массивом' },
        { status: 400 }
      );
    }

    const deletedUrls: string[] = [];
    const errors: string[] = [];

    // Удаляем файлы, которые больше не нужны
    for (const url of urlsToDelete) {
      try {
        const key = extractKeyFromUrl(url);
        if (!key) {
          errors.push(`Некорректный URL: ${url}`);
          continue;
        }

        // Проверяем, что файл не входит в список сохраняемых
        if (urlsToKeep.includes(url)) {
          continue;
        }

        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        await s3Client.send(deleteCommand);
        deletedUrls.push(url);
      } catch (error) {
        console.error(`Error deleting ${url}:`, error);
        errors.push(`Ошибка удаления ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedUrls.length,
      deletedUrls,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка очистки файлов', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
