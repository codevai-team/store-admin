import { S3Client } from '@aws-sdk/client-s3';

// Конфигурация S3 клиента для Timeweb
export const s3Client = new S3Client({
  region: 'ru-1', // Регион для Timeweb
  endpoint: process.env.S3_URL,
  credentials: {
    accessKeyId: process.env.PICTURES_TRIAL_TEST_BUCKET_S3_ACCESS_KEY!,
    secretAccessKey: process.env.PICTURES_TRIAL_TEST_BUCKET_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Важно для совместимости с Timeweb
});

export const BUCKET_NAME = process.env.PICTURES_TRIAL_TEST_BUCKET!;

// Функция для генерации уникального имени файла
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `products/${timestamp}-${randomString}.${extension}`;
}

// Функция для получения публичного URL файла
export function getPublicUrl(key: string): string {
  return `${process.env.S3_URL}/${BUCKET_NAME}/${key}`;
}

// Извлечение ключа из URL
export function extractKeyFromUrl(url: string): string | null {
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
