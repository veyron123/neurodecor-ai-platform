# 🚀 Vercel Deployment Guide - NeuroDecor

## ⚡ Quick Deploy (5 минут)

### **1️⃣ Подготовка (уже готово)**
- ✅ `vercel.json` конфигурация создана
- ✅ Проект в GitHub
- ✅ Environment переменные подготовлены

### **2️⃣ Установка Vercel CLI**
```bash
npm install -g vercel
```

### **3️⃣ Деплой**
```bash
# В корневой папке проекта
vercel

# При первом запуске ответить:
# ? Set up and deploy "NeuroDecor"? [Y/n] Y
# ? Which scope do you want to deploy to? [Your account]
# ? Link to existing project? [y/N] N
# ? What's your project's name? neurodecor-ai-platform
# ? In which directory is your code located? ./
```

### **4️⃣ Production Deploy**
```bash
vercel --prod
```

---

## 🔑 Environment Variables Setup

**После деплоя идите в Vercel Dashboard:**

1. **Проект** → **Settings** → **Environment Variables**

2. **Добавьте переменные:**

```env
# Backend API Keys
BFL_API_KEY=c06495ce-9a67-4a9d-b387-0b5b2dac9d28
WAYFORPAY_MERCHANT_ACCOUNT=www_neurodecor_site  
WAYFORPAY_MERCHANT_SECRET_KEY=6b21353052bcc45091badecde0a4c213395b0f6d

# Firebase Service Account (в одну строку!)
FIREBASE_ADMIN_KEY={"type":"service_account","project_id":"my-new-home-design-app",...}

# Frontend Firebase Config
REACT_APP_API_KEY=AIzaSyC3iEskjgqXA3BTezc4Kg8zUuOnnch3I_U
REACT_APP_AUTH_DOMAIN=my-new-home-design-app.firebaseapp.com
REACT_APP_PROJECT_ID=my-new-home-design-app
REACT_APP_STORAGE_BUCKET=my-new-home-design-app.firebasestorage.app
REACT_APP_MESSAGING_SENDER_ID=874060215664
REACT_APP_APP_ID=1:874060215664:web:a6b849473b3a4535cfcbb5
```

3. **Redeploy:**
```bash
vercel --prod
```

---

## 📱 Expected URLs

**После деплоя получите:**
- **Main App**: `https://neurodecor-ai-platform.vercel.app`
- **API Health**: `https://neurodecor-ai-platform.vercel.app/health`
- **Transform API**: `https://neurodecor-ai-platform.vercel.app/transform`

---

## 🧪 Testing Deployment

**1. Health Check:**
```bash
curl https://neurodecor-ai-platform.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "services": {
    "flux": "ready",
    "firebase": "ready", 
    "wayforpay": "ready"
  },
  "uptime": "0s"
}
```

**2. Frontend Test:**
- Откройте `https://neurodecor-ai-platform.vercel.app`
- Должен загрузиться React интерфейс
- Проверьте, что нет CORS ошибок

---

## ⚙️ Vercel Configuration Details

**`vercel.json` настроена для:**
- ✅ **Backend API** → Serverless Functions
- ✅ **Frontend React** → Static Build  
- ✅ **API Routes** → `/api/*`, `/health`, `/transform`
- ✅ **SPA Routing** → Все остальные маршруты → `index.html`
- ✅ **50MB Limit** для обработки изображений

---

## 🔧 Troubleshooting

**Build Errors:**
```bash
# Проверить локальную сборку
cd frontend && npm run build
cd ../backend && npm install
```

**Environment Issues:**
- Проверьте переменные в Vercel Dashboard
- Firebase JSON должен быть в одну строку
- Redeploy после изменения переменных

**Function Timeout:**
- Vercel Hobby: 10 сек лимит
- Для больших изображений может понадобиться Pro план ($20/мес)

---

## 🎯 Advantages of Vercel

✅ **Бесплатно без карты**
✅ **Автоматический HTTPS** 
✅ **Global CDN**
✅ **GitHub интеграция**
✅ **Предпросмотр PR**
✅ **Аналитика**

**Лимиты Hobby плана:**
- 100 GB bandwidth/месяц
- 10 секунд timeout функций  
- 6000 минут build времени

---

**Готовы к деплою!** 🚀