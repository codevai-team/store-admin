# Динамическое отображение логина администратора

## Обзор изменений
Заменено статическое отображение логина "bugu_admin" на динамическое получение из базы данных из таблицы `settings`.

## Проблема
В хедере логин администратора был жестко задан как "bugu_admin", что не соответствовало реальному логину из базы данных.

## Решение
Добавлена загрузка логина администратора из API `/api/admin/settings`, который получает значение из таблицы `settings` где `key = 'admin_login'`.

## Изменения в коде

### 1. Добавлено состояние для логина
```typescript
const [adminLogin, setAdminLogin] = useState<string>('admin');
```

### 2. Добавлен useEffect для загрузки логина
```typescript
// Загрузка логина администратора
useEffect(() => {
  const fetchAdminLogin = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const settings = await response.json();
        if (settings.admin_login) {
          setAdminLogin(settings.admin_login);
        }
      }
    } catch (error) {
      console.error('Error fetching admin login:', error);
    }
  };

  fetchAdminLogin();
}, []);
```

### 3. Заменено статическое значение на динамическое
```typescript
// Было:
<div className="text-xs text-gray-400">bugu_admin</div>

// Стало:
<div className="text-xs text-gray-400">{adminLogin}</div>
```

## Используемый API

### Endpoint: `/api/admin/settings`
- **Метод**: GET
- **Описание**: Возвращает все настройки системы (кроме пароля)
- **Ответ**: 
```json
{
  "admin_login": "actual_admin_login",
  "telegram_bot_token": "...",
  "telegram_chat_id": "...",
  // другие настройки
}
```

### Структура БД
```sql
-- Таблица settings
CREATE TABLE settings (
  id VARCHAR PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Запись с логином администратора
INSERT INTO settings (key, value) VALUES ('admin_login', 'your_admin_login');
```

## Поведение

### При загрузке компонента:
1. **Инициализация**: логин устанавливается в значение по умолчанию "admin"
2. **API запрос**: отправляется запрос к `/api/admin/settings`
3. **Обновление**: если в ответе есть `admin_login`, состояние обновляется
4. **Отображение**: в интерфейсе показывается актуальный логин

### При ошибке:
- Если API недоступен или возвращает ошибку, остается значение по умолчанию "admin"
- Ошибка логируется в консоль для отладки

## Преимущества

1. **Актуальность**: логин всегда соответствует настройкам в БД
2. **Гибкость**: можно изменить логин через страницу настроек
3. **Безопасность**: используется существующий API без дополнительных эндпоинтов
4. **Fallback**: есть значение по умолчанию при ошибках

## Связанные компоненты

- **Header.tsx**: отображает логин в меню профиля
- **API /api/admin/settings**: предоставляет настройки системы
- **Страница настроек**: позволяет изменить логин администратора

## Результат
Теперь в меню профиля отображается реальный логин администратора из базы данных, который можно изменить через интерфейс настроек.
