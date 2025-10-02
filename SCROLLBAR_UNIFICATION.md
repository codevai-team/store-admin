# Унификация скроллбаров

## Обзор
Все скроллбары в проекте теперь используют единый стиль, основанный на дизайне из графика "Дневная статистика".

## Глобальные стили
Стили определены в `src/app/globals.css`:

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #6b7280 #172130;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background-color: #172130 !important;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #6b7280 !important;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af !important;
}
```

## Цветовая схема
- **Трек (дорожка)**: `#172130` (темно-серый)
- **Ползунок**: `#6b7280` (серый)
- **Ползунок при наведении**: `#9ca3af` (светло-серый)
- **Размер**: 6px (ширина и высота)
- **Скругление**: 3px

## Обновленные компоненты

### Основные компоненты
- `src/components/admin/AdminLayout.tsx` - основной контейнер
- `src/components/admin/Sidebar.tsx` - боковая панель
- `src/components/admin/GlobalSearch.tsx` - глобальный поиск
- `src/components/admin/dashboard/DailyOrdersChart.tsx` - график статистики

### Страницы администратора
- `src/app/admin/orders/page.tsx` - страница заказов
- `src/app/admin/staff/page.tsx` - страница сотрудников  
- `src/app/admin/categories/page.tsx` - страница категорий
- `src/app/admin/products/page.tsx` - страница продуктов

### Модальные окна продуктов
- `src/components/admin/products/MobileProductViewModal.tsx`
- `src/components/admin/products/CustomSelect.tsx`
- `src/components/admin/products/SimpleAddProductModal.tsx`
- `src/components/admin/products/ImageViewer.tsx`
- `src/components/admin/products/MobileImageGallery.tsx`
- `src/components/admin/products/ImageUploadModal.tsx`
- `src/components/admin/products/EditProductModal.tsx`
- `src/components/admin/products/AddProductModal.tsx`

### Модальные окна сотрудников
- `src/components/admin/staff/EditUserModal.tsx`

## Использование
Просто добавьте класс `scrollbar-thin` к любому элементу с `overflow-auto`, `overflow-y-auto` или `overflow-x-auto`:

```jsx
<div className="overflow-y-auto scrollbar-thin">
  {/* Контент */}
</div>
```

## Поддержка браузеров
- **Webkit (Chrome, Safari, Edge)**: Полная поддержка через `-webkit-scrollbar`
- **Firefox**: Поддержка через `scrollbar-width` и `scrollbar-color`
- **Другие браузеры**: Используют стандартные скроллбары

## Преимущества
1. **Единообразие**: Все скроллбары выглядят одинаково
2. **Производительность**: Нет дублирования CSS-кода
3. **Поддержка**: Легко изменить стиль во всем проекте
4. **Совместимость**: Работает во всех современных браузерах
