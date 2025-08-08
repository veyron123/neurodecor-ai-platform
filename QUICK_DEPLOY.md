# ⚡ Quick Deploy Guide - NeuroDecor на Render

## 🚀 Быстрый старт (5 минут)

### 1. Подготовка кода
```bash
# Убедитесь, что код загружен на GitHub
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy на Render

**Способ 1: Blueprint (Рекомендуется)**
1. Перейдите на [render.com](https://render.com)
2. Подключите GitHub аккаунт
3. Нажмите "New" → "Blueprint" 
4. Выберите репозиторий NeuroDecor
5. Нажмите "Apply"

**Способ 2: Ручная настройка**
1. Backend: "New" → "Web Service" → выберите репозиторий
2. Frontend: "New" → "Static Site" → выберите репозиторий

### 3. Настройка переменных окружения

**Backend Service Environment Variables:**
```
NODE_ENV=production
PORT=10000
BFL_API_KEY=ваш_flux_api_ключ
WAYFORPAY_MERCHANT_ACCOUNT=ваш_мерчант_аккаунт
WAYFORPAY_MERCHANT_SECRET_KEY=ваш_секретный_ключ
FIREBASE_ADMIN_KEY={"type":"service_account","project_id":"..."}
```

**Frontend Service Environment Variables:**
```
REACT_APP_API_URL=https://neurodecor-backend.onrender.com
REACT_APP_API_KEY=ваш_firebase_api_ключ
REACT_APP_AUTH_DOMAIN=ваш-проект.firebaseapp.com
REACT_APP_PROJECT_ID=ваш-проект-id
REACT_APP_STORAGE_BUCKET=ваш-проект.firebasestorage.app
REACT_APP_MESSAGING_SENDER_ID=ваш_sender_id
REACT_APP_APP_ID=ваш_app_id
```

## 📋 Checklist для деплоя

- [ ] Код загружен на GitHub
- [ ] Render аккаунт подключен к GitHub
- [ ] Все API ключи готовы
- [ ] Firebase проект настроен
- [ ] Flux.1 API ключ получен
- [ ] WayForPay аккаунт настроен

## 🔑 Где получить API ключи

**1. Flux.1 Kontext API:**
- Перейдите на [api.bfl.ml](https://api.bfl.ml)
- Зарегистрируйтесь и получите API ключ
- Скопируйте в `BFL_API_KEY`

**2. Firebase:**
- Перейдите в [Firebase Console](https://console.firebase.google.com)
- Выберите проект или создайте новый
- Project Settings → General → SDK setup
- Скопируйте конфигурацию в переменные `REACT_APP_*`
- Project Settings → Service Accounts → Generate new private key
- Скопируйте JSON в `FIREBASE_ADMIN_KEY`

**3. WayForPay:**
- Зарегистрируйтесь на [wayforpay.com](https://wayforpay.com)
- Получите merchant account и secret key
- Скопируйте в соответствующие переменные

## 🌐 URLs после деплоя

**Backend API:** https://neurodecor-backend.onrender.com  
**Frontend App:** https://neurodecor-frontend.onrender.com  
**Health Check:** https://neurodecor-backend.onrender.com/health

## 🔧 Частые проблемы

**Backend не запускается:**
- Проверьте переменные окружения
- Убедитесь, что Firebase JSON валидный
- Посмотрите логи в Render dashboard

**Frontend не загружается:**
- Проверьте `REACT_APP_API_URL`
- Убедитесь, что build прошел успешно
- Проверьте все `REACT_APP_*` переменные

**CORS ошибки:**
- Frontend URL должен быть в whitelist backend
- Проверьте HTTPS использование

## ⚡ Команды для тестирования

```bash
# Проверить health backend
curl https://neurodecor-backend.onrender.com/health

# Проверить frontend
curl https://neurodecor-frontend.onrender.com

# Локальное тестирование
npm run test:backend
npm run test:frontend
```

## 🎯 Быстрые команды

```bash
# Установить все зависимости
npm run install:all

# Сборка проекта
npm run build

# Запуск тестов
npm test

# Локальная разработка
npm run dev:backend  # терминал 1
npm run dev:frontend # терминал 2
```

---

**Время деплоя:** ~5-10 минут  
**Статус:** ✅ Готов к production  
**Auto-Deploy:** На каждый push в main