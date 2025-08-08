# 🚀 Single Host Deployment - NeuroDecor

## 🎯 Все на одном хостинге - варианты

### ✅ **Вариант 1: Railway (рекомендую)**
**Преимущества**: 
- $5 кредит/месяц для обоих сервисов
- Простая настройка
- Автоматический SSL
- Хорошая производительность

### ✅ **Вариант 2: Vercel (проще)**
**Преимущества**:
- Frontend уже работает
- Простое добавление serverless функций
- Бесплатно для старта

### ✅ **Вариант 3: Netlify**
**Преимущества**:
- Netlify Functions для API
- Бесплатный план
- Простая настройка

---

## 🚀 Railway - Full Stack Deployment

### **Структура:**
```
https://neurodecor.railway.app
├── / → React Frontend (статические файлы)
├── /api → Node.js Backend API
└── /health → Health check
```

### **Настройка backend для статической раздачи:**

#### Обновить backend/server.js:

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS настройки
const allowedOrigins = [
  'http://localhost:3000',
  'https://neurodecor.railway.app',
  'https://neurodecor-production.up.railway.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы frontend (ВАЖНО - после CORS но до API роутов)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/transform', async (req, res) => {
  // Ваш API для трансформации изображений
  res.json({ message: 'API работает! Подключите Flux.1 API' });
});

// Catch all handler - отдаем React app для всех остальных маршрутов
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NeuroDecor server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
```

### **Обновленный package.json для backend:**

```json
{
  "scripts": {
    "start": "node server.js",
    "build": "cd ../frontend && npm install --legacy-peer-deps && npm run build",
    "dev": "nodemon server.js"
  }
}
```

### **Railway Build Configuration:**

```yaml
# railway.yaml
services:
  - type: web
    name: neurodecor-fullstack
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
```

---

## 🔧 Vercel Serverless Functions

### **Структура:**
```
https://neurodecor.vercel.app
├── / → React Frontend
└── /api → Serverless Functions
```

### **Создать API функцию:**

#### `frontend/api/transform.js`:
```javascript
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Логика трансформации изображений
    return res.json({ message: 'Vercel API работает!' });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
```

#### **Обновить frontend API URL:**
```javascript
// В App.js заменить
const API_URL = window.location.origin + '/api';
```

---

## 🎯 Netlify Functions

### **Создать Netlify функцию:**

#### `frontend/netlify/functions/transform.js`:
```javascript
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod === 'POST') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Netlify Function работает!' })
    };
  }

  return { statusCode: 405, headers };
};
```

---

## 💰 Сравнение стоимости

| Хостинг | Frontend | Backend | Итого/мес |
|---------|----------|---------|-----------|
| **Railway** | Включен | $5 кредит | ~$5 |
| **Vercel** | Бесплатно | Serverless лимиты | $0-20 |
| **Netlify** | Бесплатно | Functions лимиты | $0-19 |

---

## 🎯 Рекомендация

### ✅ **Railway Full-Stack (лучший вариант)**
**Почему:**
- Все в одном месте
- Фиксированная цена $5/мес
- Реальный сервер (не serverless)
- Простая настройка
- SSL автоматически

### 🔧 **Как реализовать:**
1. Обновить backend для статической раздачи
2. Собрать frontend build в backend
3. Настроить Railway для full-stack деплоя
4. Один домен, один SSL, все просто

**Готов настроить Railway full-stack прямо сейчас!** 🚀