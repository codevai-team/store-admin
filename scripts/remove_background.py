#!/usr/bin/env python3
"""
Скрипт для удаления фона с изображений используя rembg
"""

import sys
import os
import io
import base64
from PIL import Image
from rembg import remove

def remove_background_from_image(image_data):
    """
    Удаляет фон с изображения и возвращает изображение с белым фоном
    
    Args:
        image_data: байты изображения
        
    Returns:
        tuple: (original_base64, processed_base64) - оригинал и обработанное изображение в base64
    """
    try:
        # Открываем оригинальное изображение
        original_image = Image.open(io.BytesIO(image_data))
        
        # Конвертируем в RGB если нужно
        if original_image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', original_image.size, (255, 255, 255))
            if original_image.mode == 'RGBA':
                background.paste(original_image, mask=original_image.split()[-1])
            else:
                background.paste(original_image)
            original_image = background
        elif original_image.mode != 'RGB':
            original_image = original_image.convert('RGB')
        
        # Сохраняем оригинал в base64 (сохраняем оригинальный размер)
        original_buffer = io.BytesIO()
        original_image.save(original_buffer, format='JPEG', quality=90)
        original_base64 = base64.b64encode(original_buffer.getvalue()).decode('utf-8')
        
        # Удаляем фон
        output_data = remove(image_data)
        
        # Открываем обработанное изображение
        processed_image = Image.open(io.BytesIO(output_data))
        
        # Убеждаемся, что размер обработанного изображения такой же как у оригинала
        if processed_image.size != original_image.size:
            processed_image = processed_image.resize(original_image.size, Image.Resampling.LANCZOS)
        
        # Создаем белый фон с тем же размером что и оригинал
        white_background = Image.new('RGB', original_image.size, (255, 255, 255))
        
        # Накладываем изображение без фона на белый фон
        if processed_image.mode == 'RGBA':
            white_background.paste(processed_image, mask=processed_image.split()[-1])
        else:
            white_background.paste(processed_image)
        
        # Сохраняем результат в base64 с тем же качеством
        processed_buffer = io.BytesIO()
        white_background.save(processed_buffer, format='JPEG', quality=95, optimize=True)
        processed_base64 = base64.b64encode(processed_buffer.getvalue()).decode('utf-8')
        
        return original_base64, processed_base64
        
    except Exception as e:
        raise Exception(f"Ошибка обработки изображения: {str(e)}")

def main():
    """
    Основная функция для использования из командной строки
    """
    if len(sys.argv) != 2:
        print("Использование: python remove_background.py <путь_к_изображению>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(f"Файл не найден: {image_path}")
        sys.exit(1)
    
    try:
        # Читаем изображение
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Обрабатываем изображение
        original_b64, processed_b64 = remove_background_from_image(image_data)
        
        # Выводим результат в JSON формате
        import json
        result = {
            "success": True,
            "original": original_b64,
            "processed": processed_b64
        }
        print(json.dumps(result))
        
    except Exception as e:
        import json
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()

