# 🔐 Google OAuth Setup для NeuroDecor

## 📋 **Что сделано:**

✅ **Frontend**: 
- Добавлена библиотека `react-google-login`
- Обновлен `LoginModal.js` с Google OAuth кнопкой
- Добавлена функция `signInWithGoogle` в `authService.js`

✅ **Backend**:
- Добавлена библиотека `google-auth-library`
- Создан endpoint `/api/auth/google` в `server-postgres.js`
- Интеграция с PostgreSQL для Google пользователей

## ⚙️ **Настройка Google OAuth:**

### 1. **Создать Google OAuth приложение:**
1. Зайдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Google+ API**
4. Перейдите в **APIs & Services > Credentials**
5. Нажмите **Create Credentials > OAuth 2.0 Client ID**
6. Выберите **Web application**
7. Добавьте домены:
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (для разработки)
     - `https://neurodecor-frontend.onrender.com` (продакшн)
   - **Authorized redirect URIs**: (обычно не нужны для фронтенд OAuth)

### 2. **Настроить переменные окружения:**

**Frontend (.env.production):**
```env
REACT_APP_GOOGLE_CLIENT_ID=ваш_google_client_id.apps.googleusercontent.com
```

**Backend (Render.com environment variables):**
```env
GOOGLE_CLIENT_ID=ваш_google_client_id.apps.googleusercontent.com
```

### 3. **Обновить Render.com:**
1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Откройте **neurodecor-backend** сервис
3. Перейдите в **Environment**
4. Добавьте переменную:
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: `ваш_google_client_id.apps.googleusercontent.com`
5. Нажмите **Save Changes** → сервис автоматически перезапустится

6. Откройте **neurodecor-frontend** сервис
7. Перейдите в **Environment** 
8. Добавьте переменную:
   - **Key**: `REACT_APP_GOOGLE_CLIENT_ID`
   - **Value**: `ваш_google_client_id.apps.googleusercontent.com`
9. Нажмите **Save Changes** → сервис автоматически перезапустится

## 🧪 **Как протестировать:**

1. **После настройки переменных окружения:**
   - Откройте ваш сайт
   - Нажмите на кнопку входа
   - Нажмите "Continue with Google"
   - Должно открыться окно Google OAuth

2. **При успешной аутентификации:**
   - Пользователь автоматически создается/входит в PostgreSQL
   - Выдается JWT токен
   - Пользователь получает доступ к покупке кредитов

## 🔧 **Структура работы:**

```
1. Пользователь → "Continue with Google"
2. Google OAuth → возвращает токен
3. Frontend → отправляет токен на /api/auth/google  
4. Backend → проверяет токен с Google
5. Backend → создает/находит пользователя в PostgreSQL
6. Backend → возвращает JWT токен
7. Frontend → сохраняет токен, пользователь вошел
```

## ⚠️ **Важные моменты:**

- **Client ID должен быть одинаковым** в frontend и backend
- **Домены должны быть добавлены** в Google Console
- **После изменения переменных** Render автоматически перезапускает сервисы
- **Google пользователи** получают пароль-заглушку в PostgreSQL

## 🎯 **Результат:**

После настройки у пользователей будет:
- ✅ Вход через email/пароль (PostgreSQL)
- ✅ Вход через Google OAuth (PostgreSQL + Google)
- ✅ Единая система кредитов
- ✅ Одинаковые платежи WayForPay