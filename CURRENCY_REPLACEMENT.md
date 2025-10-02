# Замена валюты с рублей на сомы

## Обзор изменений
Заменена валюта во всем проекте с российских рублей (₽, RUB) на киргизские сомы (⃀, KGS).

## Выполненные изменения

### 1. Замена символов валюты
**Символ**: `₽` → `⃀`

**Затронутые файлы:**
- `src/components/admin/products/EditProductModal.tsx` - цены в вариантах товаров и формы
- `src/components/admin/products/AddProductModal.tsx` - цены в вариантах товаров и формы  
- `src/components/admin/GlobalSearch.tsx` - цены в результатах поиска
- `src/components/admin/dashboard/DailyOrdersChart.tsx` - отображение выручки

**Примеры изменений:**
```typescript
// Было:
<span className="text-green-400 font-semibold">{variant.price} ₽</span>

// Стало:
<span className="text-green-400 font-semibold">{variant.price} ⃀</span>
```

### 2. Замена кода валюты
**Код валюты**: `RUB` → `KGS`

**Затронутые файлы:**
- `src/app/admin/dashboard/page.tsx`
- `src/components/admin/products/EditProductModal.tsx`
- `src/app/admin/orders/page.tsx`
- `src/app/admin/products/page.tsx`
- `src/components/admin/products/MobileProductViewModal.tsx`
- `src/components/admin/dashboard/DailyOrdersChart.tsx`
- `src/components/admin/dashboard/RecentOrders.tsx`
- `src/components/admin/dashboard/TopCategoriesChart.tsx`
- `src/components/admin/dashboard/ProductInsightsChart.tsx`
- `src/components/admin/dashboard/CourierPerformanceChart.tsx`
- `src/components/admin/dashboard/TopProductsChart.tsx`
- `src/components/admin/dashboard/RevenueChart.tsx`
- `src/components/admin/dashboard/OrderStatusChart.tsx`
- `src/components/admin/products/MobileProductCard.tsx`

**Примеры изменений:**
```typescript
// Было:
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(value);
};

// Стало:
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0,
  }).format(value);
};
```

### 3. Специальная обработка в графиках
В `DailyOrdersChart.tsx` добавлена специальная обработка для замены символа:

```typescript
// Заменяем ₽ на ⃀ в отображении
{formatCurrency(day.revenue).replace('₽', '⃀').replace(/\s/g, '')}
```

## Валютная информация

### Киргизский сом (KGS)
- **Символ**: ⃀ (U+2040)
- **Код ISO**: KGS
- **Название**: Киргизский сом
- **Подразделение**: 1 сом = 100 тыйын

### Локализация
Сохранена русская локализация (`ru-RU`) для форматирования чисел, изменен только код валюты на `KGS`.

## Области применения

### Отображение цен:
- ✅ Карточки товаров
- ✅ Модальные окна товаров  
- ✅ Формы создания/редактирования товаров
- ✅ Результаты поиска
- ✅ Заказы и их детали

### Графики и аналитика:
- ✅ График выручки
- ✅ Дневная статистика
- ✅ Топ товары по продажам
- ✅ Топ категории
- ✅ Статистика курьеров
- ✅ Анализ продуктов

## Результат
- ✅ Все цены отображаются в сомах (⃀)
- ✅ Форматирование валюты использует код KGS
- ✅ Сохранена русская локализация для чисел
- ✅ Единообразное отображение во всем приложении

## Совместимость
Изменения полностью обратно совместимы - все существующие данные в базе остаются без изменений, меняется только отображение в интерфейсе.
