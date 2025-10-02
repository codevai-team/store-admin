import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';

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

// Функция для генерации имени файла с удаленным фоном
function generateProcessedFileName(originalKey: string): string {
  const pathParts = originalKey.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const nameWithoutExt = fileName.split('.')[0];
  const ext = fileName.split('.').pop();
  return `${pathParts.slice(0, -1).join('/')}/${nameWithoutExt}_no_bg.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL изображения не указан' },
        { status: 400 }
      );
    }

    // Извлекаем ключ из URL
    const originalKey = extractKeyFromUrl(imageUrl);
    if (!originalKey) {
      return NextResponse.json(
        { error: 'Некорректный URL изображения' },
        { status: 400 }
      );
    }

    // Генерируем имя для обработанного файла
    const processedKey = generateProcessedFileName(originalKey);

    // Проверяем, существует ли уже обработанная версия
    try {
      const checkCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: processedKey,
      });
      await s3Client.send(checkCommand);
      
      // Если файл уже существует, возвращаем его URL
      const processedUrl = `${process.env.S3_URL}/${BUCKET_NAME}/${processedKey}`;
      return NextResponse.json({
        success: true,
        originalUrl: imageUrl,
        processedUrl: processedUrl,
        message: 'Обработанное изображение уже существует'
      });
    } catch {
      // Файл не существует, продолжаем обработку
    }

    // Скачиваем оригинальное изображение из S3
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey,
    });

    const response = await s3Client.send(getCommand);
    const imageData = await response.Body?.transformToByteArray();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'Не удалось загрузить изображение' },
        { status: 400 }
      );
    }

    // Создаем временные файлы с кроссплатформенной поддержкой
    const tempDir = os.tmpdir(); // Используем системную временную директорию
    const inputFileName = `input_${randomUUID()}.jpg`;
    const outputFileName = `output_${randomUUID()}.jpg`;
    const inputPath = path.join(tempDir, inputFileName);
    const outputPath = path.join(tempDir, outputFileName);

    // Убеждаемся, что временная директория существует
    if (!fs.existsSync(tempDir)) {
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (mkdirError) {
        console.error('Failed to create temp directory:', mkdirError);
        return NextResponse.json(
          { error: 'Не удалось создать временную директорию', details: mkdirError instanceof Error ? mkdirError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    console.log('Using temp directory:', tempDir);
    console.log('Input file path:', inputPath);

    try {
      // Сохраняем оригинальное изображение во временный файл
      fs.writeFileSync(inputPath, Buffer.from(imageData));

      // Запускаем Python скрипт для удаления фона
      const pythonScript = path.join(process.cwd(), 'scripts', 'remove_background.py');
      
      // Проверяем существование Python скрипта
      if (!fs.existsSync(pythonScript)) {
        return NextResponse.json(
          { error: 'Python скрипт не найден', details: `Script path: ${pythonScript}` },
          { status: 500 }
        );
      }
      
      // Определяем команду Python в зависимости от платформы
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      console.log('Running Python command:', pythonCommand);
      console.log('Python script path:', pythonScript);
      console.log('Input path:', inputPath);
      
      const pythonProcess = spawn(pythonCommand, [pythonScript, inputPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Обработка ошибки запуска процесса
      pythonProcess.on('error', (spawnError) => {
        console.error('Failed to start Python process:', spawnError);
        throw new Error(`Не удалось запустить Python: ${spawnError.message}`);
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Ждем завершения процесса
      const exitCode = await new Promise((resolve) => {
        pythonProcess.on('close', resolve);
      });

      if (exitCode !== 0) {
        console.error('Python script error:', stderr);
        console.error('Python script stdout:', stdout);
        console.error('Python script exit code:', exitCode);
        return NextResponse.json(
          { error: 'Ошибка обработки изображения', details: stderr || 'Python script failed' },
          { status: 500 }
        );
      }

      // Парсим результат из JSON
      let result;
      try {
        result = JSON.parse(stdout);
      } catch {
        console.error('Failed to parse Python output:', stdout);
        return NextResponse.json(
          { error: 'Ошибка парсинга результата обработки' },
          { status: 500 }
        );
      }

      if (!result.success) {
        return NextResponse.json(
          { error: 'Ошибка обработки изображения', details: result.error },
          { status: 500 }
        );
      }

      // Конвертируем base64 обработанного изображения в Buffer
      const processedImageBuffer = Buffer.from(result.processed, 'base64');

      // Загружаем обработанное изображение в S3
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: processedKey,
        Body: processedImageBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });

      await s3Client.send(putCommand);

      // Формируем URL обработанного изображения
      const processedUrl = `${process.env.S3_URL}/${BUCKET_NAME}/${processedKey}`;

      return NextResponse.json({
        success: true,
        originalUrl: imageUrl,
        processedUrl: processedUrl,
        message: 'Фон успешно удален'
      });

    } finally {
      // Очищаем временные файлы
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
    }

  } catch (error) {
    console.error('Remove background error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка удаления фона', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
