# Исправление логики закрытия меню профиля

## Проблема
Меню профиля закрывалось при клике на любое место в хедере, включая кнопки и другие элементы, из-за overlay, который покрывал весь экран.

## Решение
Заменили overlay на точечную проверку клика вне меню с использованием `useRef` и `useEffect`.

## Изменения в коде

### 1. Добавлены импорты
```typescript
// Было:
import { useState } from 'react';

// Стало:
import { useState, useRef, useEffect } from 'react';
```

### 2. Добавлен ref для меню
```typescript
const profileMenuRef = useRef<HTMLDivElement>(null);
```

### 3. Заменена логика закрытия меню
```typescript
// Старая логика (простая функция):
const handleClickOutside = () => {
  setIsProfileMenuOpen(false);
};

// Новая логика (useEffect с проверкой клика вне элемента):
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
      setIsProfileMenuOpen(false);
    }
  };

  if (isProfileMenuOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isProfileMenuOpen]);
```

### 4. Добавлен ref к контейнеру профиля
```typescript
// Было:
<div className="relative">

// Стало:
<div className="relative" ref={profileMenuRef}>
```

### 5. Убран overlay
```typescript
// Было:
{isProfileMenuOpen && (
  <>
    <div
      className="fixed inset-0 z-[60]"
      onClick={handleClickOutside}
    />
    <div className="absolute right-0 mt-3 w-56 rounded-xl shadow-2xl bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 z-[70] overflow-hidden">
      {/* Содержимое меню */}
    </div>
  </>
)}

// Стало:
{isProfileMenuOpen && (
  <div className="absolute right-0 mt-3 w-56 rounded-xl shadow-2xl bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 z-[70] overflow-hidden">
    {/* Содержимое меню */}
  </div>
)}
```

## Как это работает

### Принцип работы:
1. **Ref привязан к контейнеру** всего профиля (кнопка + меню)
2. **Event listener** отслеживает клики по всему документу
3. **Проверка `contains()`** определяет, был ли клик внутри контейнера профиля
4. **Меню закрывается** только если клик был вне контейнера

### Преимущества нового подхода:
- ✅ Клик по кнопке профиля не закрывает меню
- ✅ Клик по элементам хедера не закрывает меню
- ✅ Клик по самому меню не закрывает его
- ✅ Меню закрывается только при клике вне всего блока профиля
- ✅ Автоматическая очистка event listener при размонтировании

### Поведение:
- **Клик по кнопке профиля**: меню открывается/закрывается
- **Клик по элементам меню**: меню остается открытым (кроме кнопок с действиями)
- **Клик по хедеру**: меню остается открытым
- **Клик по основному контенту**: меню закрывается
- **Клик по сайдбару**: меню закрывается
- **Клик вне приложения**: меню закрывается

## Результат
Теперь меню профиля ведет себя интуитивно и закрывается только при клике действительно вне его области, а не при любом клике в хедере.
