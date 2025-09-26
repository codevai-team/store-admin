#!/bin/bash

# Установка Python зависимостей для удаления фона
echo "Установка Python зависимостей для удаления фона..."

# Проверяем, установлен ли Python3
if ! command -v python3 &> /dev/null; then
    echo "Python3 не найден. Пожалуйста, установите Python3."
    exit 1
fi

# Устанавливаем зависимости
pip3 install -r requirements.txt

echo "Зависимости установлены успешно!"
echo "Теперь можно использовать функцию удаления фона."
