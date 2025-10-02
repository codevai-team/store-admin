# Обновление отображения валюты: только символ ⃀

## Обзор изменений
Изменено форматирование валюты во всем проекте - теперь отображается только число с символом ⃀, без использования автоматического форматирования валюты через Intl.NumberFormat.

## Проблема
Ранее использовалось `currency: 'KGS'` в Intl.NumberFormat, что могло приводить к отображению "KGS" или других вариантов валютного кода вместо желаемого символа ⃀.

## Решение
Заменено форматирование валюты с использования `style: 'currency'` на простое добавление символа ⃀ к отформатированному числу.

## Изменения в коде

### Старый подход:
```typescript
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0,
  }).format(value);
};
```

### Новый подход:
```typescript
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
  }).format(value) + ' ⃀';
};
```

## Обновленные файлы

### Dashboard компоненты:
- `src/app/admin/dashboard/page.tsx`
- `src/components/admin/dashboard/DailyOrdersChart.tsx`
- `src/components/admin/dashboard/CourierPerformanceChart.tsx`
- `src/components/admin/dashboard/ProductInsightsChart.tsx`
- `src/components/admin/dashboard/RecentOrders.tsx`
- `src/components/admin/dashboard/OrderStatusChart.tsx`
- `src/components/admin/dashboard/RevenueChart.tsx`
- `src/components/admin/dashboard/TopCategoriesChart.tsx`
- `src/components/admin/dashboard/TopProductsChart.tsx`

### Страницы и компоненты товаров:
- `src/app/admin/products/page.tsx`
- `src/components/admin/products/MobileProductCard.tsx`
- `src/components/admin/products/MobileProductViewModal.tsx`
- `src/components/admin/products/EditProductModal.tsx`

### Страница заказов:
- `src/app/admin/orders/page.tsx`

## Преимущества нового подхода

### 1. **Гарантированное отображение символа**
- Всегда показывается именно ⃀, а не KGS или другие варианты
- Нет зависимости от локализации браузера

### 2. **Единообразие**
- Все цены отображаются в одном формате: "1 000 ⃀"
- Консистентность во всем приложении

### 3. **Простота**
- Более простой и предсказуемый код
- Легче поддерживать и изменять

### 4. **Производительность**
- Меньше обращений к Intl.NumberFormat с валютными настройками
- Более быстрое форматирование

## Примеры отображения

### До изменений:
- Могло показываться: "1 000 KGS" или "1 000 сом" (в зависимости от браузера)

### После изменений:
- Всегда показывается: "1 000 ⃀"

## Сохраненные возможности

### Форматирование чисел:
- ✅ Разделители тысяч (пробелы)
- ✅ Русская локализация чисел
- ✅ Настройка десятичных знаков (minimumFractionDigits: 0)

### Удаленные возможности:
- ❌ Автоматическое определение валютного символа
- ❌ Зависимость от настроек браузера для валюты

## Специальная обработка

### DailyOrdersChart.tsx:
Убрана специальная замена символов, так как теперь функция сразу возвращает правильный символ:

```typescript
// Было:
{formatCurrency(day.revenue).replace('₽', '⃀').replace(/\s/g, '')}

// Стало:
{formatCurrency(day.revenue).replace(/\s/g, '')}
```

## Результат
Теперь во всем проекте валюта отображается единообразно с символом ⃀, без риска показа кодов валют или других нежелательных форматов.
