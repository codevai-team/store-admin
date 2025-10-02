# Исправление ошибок линтера

## Обзор
Исправлены все предупреждения линтера в проекте для улучшения качества кода.

## Исправленные ошибки

### 1. Неиспользуемый импорт в Sidebar.tsx
**Файл**: `src/components/admin/Sidebar.tsx`
**Проблема**: Импорт `Image` из `next/image` не использовался в компоненте

**Исправление**:
```typescript
// Было:
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { navigation } from '@/lib/navigation';

// Стало:
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/lib/navigation';
```

### 2. Неиспользуемая переменная в request-code/route.ts
**Файл**: `src/app/api/admin/request-code/route.ts`
**Проблема**: Переменная `error` в catch блоке не использовалась

**Исправление**:
```typescript
// Было:
} catch (error) {
  return NextResponse.json(
    { message: 'Недействительный токен' },
    { status: 401 }
  );
}

// Стало:
} catch {
  return NextResponse.json(
    { message: 'Недействительный токен' },
    { status: 401 }
  );
}
```

## Результат
- ✅ Все предупреждения линтера устранены
- ✅ Код стал чище и соответствует стандартам
- ✅ Убраны неиспользуемые импорты и переменные
- ✅ Проект готов к продакшену

## Типы исправлений
1. **Удаление неиспользуемых импортов** - улучшает производительность сборки
2. **Упрощение catch блоков** - убирает неиспользуемые параметры ошибок

## Проверка
Команда `npm run lint` теперь не показывает предупреждений или ошибок.
