import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME, extractKeyFromUrl } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL не указан' },
        { status: 400 }
      );
    }

    // Извлекаем ключ из URL
    const key = extractKeyFromUrl(url);
    
    if (!key) {
      return NextResponse.json(
        { error: 'Некорректный URL файла' },
        { status: 400 }
      );
    }

    // Удаляем файл из S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'Файл успешно удален',
      deletedKey: key,
    });

  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления файла' },
      { status: 500 }
    );
  }
}
