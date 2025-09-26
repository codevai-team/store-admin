# Архитектура мобильных компонентов

## Структура компонентов

```
MobileProductViewModal (Главный модальный компонент)
├── Header (Фиксированный заголовок)
│   ├── Product Image (Миниатюра)
│   ├── Product Name (Название)
│   ├── Price (Цена)
│   ├── Status (Статус)
│   └── Close Button (Кнопка закрытия)
├── Content (Прокручиваемый контент)
│   ├── MobileImageGallery (Галерея изображений)
│   │   ├── Main Image (Основное изображение)
│   │   ├── Navigation Arrows (Стрелки навигации)
│   │   ├── Image Counter (Счетчик изображений)
│   │   ├── Thumbnail Navigation (Навигация по миниатюрам)
│   │   └── Fullscreen Modal (Полноэкранный режим)
│   ├── Basic Info (Основная информация)
│   │   ├── Product Name (Название товара)
│   │   ├── Price (Цена)
│   │   ├── Description (Описание)
│   │   ├── Category (Категория)
│   │   └── Seller (Продавец)
│   ├── Characteristics (Характеристики)
│   │   ├── Sizes (Размеры)
│   │   └── Colors (Цвета)
│   ├── Attributes (Атрибуты)
│   │   └── Key-Value Pairs (Пары ключ-значение)
│   └── Information (Информация)
│       ├── Created Date (Дата создания)
│       └── Updated Date (Дата обновления)
└── Footer (Фиксированный футер)
    ├── Edit Button (Кнопка редактирования)
    └── Delete Button (Кнопка удаления)

MobileProductCard (Карточка товара)
├── Image Section (Секция изображения)
│   └── Product Thumbnail (Миниатюра товара)
├── Info Section (Секция информации)
│   ├── Product Name (Название)
│   ├── Price (Цена)
│   ├── Status (Статус)
│   ├── Category (Категория)
│   ├── Seller (Продавец)
│   ├── Date (Дата)
│   ├── Sizes (Размеры)
│   └── Colors (Цвета)
└── Actions Section (Секция действий)
    ├── Edit Button (Кнопка редактирования)
    └── Delete Button (Кнопка удаления)

MobileImageGallery (Галерея изображений)
├── Main Image Container (Контейнер основного изображения)
│   ├── Image (Изображение)
│   ├── Hover Overlay (Наложение при наведении)
│   ├── Image Counter (Счетчик изображений)
│   └── Navigation Arrows (Стрелки навигации)
├── Thumbnail Navigation (Навигация по миниатюрам)
│   └── Thumbnail Buttons (Кнопки миниатюр)
└── Fullscreen Modal (Полноэкранный модальный)
    ├── Close Button (Кнопка закрытия)
    ├── Full Image (Полноразмерное изображение)
    ├── Navigation Arrows (Стрелки навигации)
    └── Image Counter (Счетчик изображений)
```

## Поток данных

```
ProductsPage
├── State Management
│   ├── isMobileViewModalOpen (Состояние мобильного модального окна)
│   ├── mobileViewingProduct (Товар для просмотра)
│   └── sellers (Список продавцов)
├── Event Handlers
│   ├── openMobileViewModal (Открытие мобильного модального окна)
│   ├── openEditModal (Открытие модального окна редактирования)
│   ├── openDeleteModal (Открытие модального окна удаления)
│   └── closeModals (Закрытие всех модальных окон)
└── Rendering
    ├── Mobile Layout (< lg)
    │   └── MobileProductCard
    │       └── onClick → openMobileViewModal
    └── Desktop Layout (>= lg)
        └── Desktop Product Card
            └── onClick → openViewModal

MobileProductViewModal
├── Props
│   ├── isOpen (Открыто ли модальное окно)
│   ├── product (Данные товара)
│   ├── onClose (Обработчик закрытия)
│   ├── onEdit (Обработчик редактирования)
│   ├── onDelete (Обработчик удаления)
│   └── sellers (Список продавцов)
├── Image Processing
│   ├── Get main image
│   ├── Get additional images
│   └── Combine into allImages array
└── Rendering
    ├── Header with product info
    ├── MobileImageGallery
    ├── Product details sections
    └── Action buttons

MobileImageGallery
├── Props
│   ├── images (Массив изображений)
│   ├── productName (Название товара)
│   └── className (CSS классы)
├── State
│   ├── currentIndex (Текущий индекс изображения)
│   └── isFullscreen (Полноэкранный режим)
└── Features
    ├── Image navigation
    ├── Thumbnail selection
    ├── Fullscreen mode
    └── Responsive design
```

## Стили и адаптивность

### Breakpoints
- **Mobile:** `< 1024px` (lg breakpoint)
- **Desktop:** `>= 1024px`

### CSS Grid и Flexbox
- **Mobile Layout:** Вертикальный стек с flexbox
- **Desktop Layout:** Горизонтальная сетка с grid
- **Responsive Images:** aspect-square для квадратных изображений
- **Touch Targets:** Минимум 44px для кнопок

### Анимации и переходы
- **Hover Effects:** scale, opacity, background changes
- **Transitions:** duration-200 для плавности
- **Loading States:** Skeleton loaders для изображений
- **Modal Animations:** backdrop-blur и fade effects

## Производительность

### Оптимизации
- **React.memo:** Для предотвращения лишних рендеров
- **useCallback:** Для стабильных ссылок на функции
- **useMemo:** Для вычисляемых значений
- **Lazy Loading:** Для изображений вне viewport

### Bundle Size
- **Tree Shaking:** Импорт только используемых иконок
- **Code Splitting:** Разделение мобильных и десктопных компонентов
- **Image Optimization:** WebP формат и responsive images

## Доступность (A11y)

### ARIA атрибуты
- **aria-label:** Для кнопок без текста
- **aria-expanded:** Для раскрывающихся элементов
- **aria-hidden:** Для декоративных элементов
- **role:** Для семантических элементов

### Навигация
- **Tab Order:** Логический порядок табуляции
- **Focus Management:** Управление фокусом в модальных окнах
- **Keyboard Shortcuts:** Escape для закрытия модальных окон

### Контрастность
- **Color Contrast:** Минимум 4.5:1 для обычного текста
- **Focus Indicators:** Видимые индикаторы фокуса
- **Status Colors:** Семантические цвета для статусов
