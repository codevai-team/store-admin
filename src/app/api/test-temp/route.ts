import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const tempDir = os.tmpdir();
    const testFileName = `test_${randomUUID()}.txt`;
    const testFilePath = path.join(tempDir, testFileName);
    const testContent = `Test content created at ${new Date().toISOString()}`;

    console.log('Platform:', process.platform);
    console.log('Temp directory:', tempDir);
    console.log('Test file path:', testFilePath);

    // Проверяем существование временной директории
    const tempDirExists = fs.existsSync(tempDir);
    console.log('Temp directory exists:', tempDirExists);

    // Создаем директорию если не существует
    if (!tempDirExists) {
      try {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('Created temp directory');
      } catch (mkdirError) {
        console.error('Failed to create temp directory:', mkdirError);
        return NextResponse.json({
          success: false,
          error: 'Cannot create temp directory',
          details: {
            platform: process.platform,
            tempDir,
            error: mkdirError instanceof Error ? mkdirError.message : 'Unknown error'
          }
        });
      }
    }

    // Пытаемся записать файл
    try {
      fs.writeFileSync(testFilePath, testContent);
      console.log('File written successfully');
    } catch (writeError) {
      console.error('Failed to write file:', writeError);
      return NextResponse.json({
        success: false,
        error: 'Cannot write to temp directory',
        details: {
          platform: process.platform,
          tempDir,
          testFilePath,
          error: writeError instanceof Error ? writeError.message : 'Unknown error'
        }
      });
    }

    // Проверяем, что файл создался
    const fileExists = fs.existsSync(testFilePath);
    console.log('File exists after write:', fileExists);

    let fileContent = '';
    if (fileExists) {
      try {
        fileContent = fs.readFileSync(testFilePath, 'utf8');
        console.log('File content read successfully');
      } catch (readError) {
        console.error('Failed to read file:', readError);
      }
    }

    // Удаляем тестовый файл
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        console.log('Test file cleaned up');
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup test file:', cleanupError);
    }

    // Проверяем права доступа к директории
    let dirStats;
    try {
      dirStats = fs.statSync(tempDir);
    } catch (statsError) {
      console.error('Failed to get directory stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Temporary file operations test completed',
      details: {
        platform: process.platform,
        tempDir,
        tempDirExists,
        fileCreated: fileExists,
        fileContentMatches: fileContent === testContent,
        dirStats: dirStats ? {
          isDirectory: dirStats.isDirectory(),
          mode: dirStats.mode.toString(8),
          uid: dirStats.uid,
          gid: dirStats.gid
        } : null,
        nodeVersion: process.version,
        processUid: process.getuid ? process.getuid() : 'N/A',
        processGid: process.getgid ? process.getgid() : 'N/A'
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: {
        platform: process.platform,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
