# 🗄️ PostgreSQL Migration Guide

## 🚀 Замена Firebase на PostgreSQL

### ✅ Что сделано:
- ✅ PostgreSQL схема создана (`backend/database/schema.sql`)
- ✅ Подключение к базе (`backend/database/db.js`)
- ✅ JWT авторизация (`backend/auth/auth.js`)
- ✅ Новый сервер (`backend/server-postgres.js`)
- ✅ Зависимости установлены (pg, bcryptjs, jsonwebtoken)

## 🔧 Настройка PostgreSQL на Render:

### 1. Создать PostgreSQL базу на Render:
1. Войти на https://dashboard.render.com/
2. **New** → **PostgreSQL**
3. **Name**: `neurodecor-db`
4. **Database**: `neurodecor`
5. **User**: `neurodecor_user`
6. **Region**: `Frankfurt (EU Central)`
7. **Plan**: `Free` (для начала)

### 2. Получить DATABASE_URL:
После создания скопировать **External Database URL** из панели.
Формат: `postgresql://user:password@host:port/database`

### 3. Добавить в переменные окружения backend на Render:
- `DATABASE_URL` = скопированный URL
- `JWT_SECRET` = `neurodecor-jwt-secret-production-2024`
- `NODE_ENV` = `production`

## 🚀 Развертывание:

### 1. Обновить package.json для PostgreSQL:
```json
{
  "scripts": {
    "start": "node server-postgres.js",
    "dev": "nodemon server-postgres.js"
  }
}
```

### 2. Коммит и деплой:
```bash
git add .
git commit -m "🗄️ Migration to PostgreSQL"
git push origin master
```

## 📊 Новые API endpoints:

### Авторизация:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Кредиты:
- `GET /api/credits` - Получить кредиты
- `POST /api/credits/deduct` - Списать кредиты

### Платежи:
- `POST /api/create-payment` - Создать платеж (требует авторизацию)
- `POST /api/payment-callback` - Callback от WayForPay

### Debug:
- `GET /api/health` - Статус базы данных
- `GET /` - Информация о сервере

## 🔄 Frontend изменения:

### 1. Заменить Firebase Auth на JWT:
```javascript
// Вместо Firebase
import { auth } from './firebase';

// Использовать обычные HTTP запросы
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
};
```

### 2. Добавить JWT токен в запросы:
```javascript
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getCredits = async () => {
  const response = await fetch('/api/credits', {
    headers: authHeaders()
  });
  return response.json();
};
```

## 🎯 Преимущества нового подхода:

- ✅ **Надежность** - никаких 400 ошибок
- ✅ **Скорость** - прямое подключение к базе
- ✅ **Простота** - обычные SQL запросы
- ✅ **Отладка** - видно все данные в pgAdmin
- ✅ **Транзакции** - ACID гарантии для платежей
- ✅ **Масштабируемость** - можно увеличивать план

## 🚨 После развертывания:

1. **Создать первого пользователя** через `/api/auth/register`
2. **Протестировать авторизацию** `/api/auth/login`
3. **Проверить кредиты** `/api/credits`
4. **Тест платеж** через новую систему
5. **Обновить frontend** для работы с JWT

## 📱 Тестирование:

```bash
# Регистрация
curl -X POST http://localhost:3007/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Вход
curl -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Проверка кредитов (с токеном)
curl -X GET http://localhost:3007/api/credits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

🎉 **PostgreSQL готов заменить Firebase!**