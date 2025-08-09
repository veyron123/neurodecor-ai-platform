# 🚀 Vercel Manual Deployment - NeuroDecor

## ⚡ Browser Deployment (Easy Way)

### **1️⃣ Откройте [vercel.com](https://vercel.com)**

### **2️⃣ Создайте аккаунт/Войдите**
- Нажмите **"Sign Up"** 
- Выберите **"Continue with GitHub"**
- Авторизуйте доступ к репозиториям

### **3️⃣ Создайте новый проект**
- На главной странице нажмите **"Add New..."** → **"Project"**
- Найдите репозиторий: **`neurodecor-ai-platform`** 
- Нажмите **"Import"**

### **4️⃣ Настройте проект**

**Framework Preset:** React
**Build Command:** `cd frontend && npm install && npm run build`
**Output Directory:** `frontend/build`
**Install Command:** `npm install`

### **5️⃣ Environment Variables**
Добавьте эти переменные:

**General Variables:**
```env
NODE_ENV=production
BFL_API_KEY=c06495ce-9a67-4a9d-b387-0b5b2dac9d28
WAYFORPAY_MERCHANT_ACCOUNT=www_neurodecor_site
WAYFORPAY_MERCHANT_SECRET_KEY=6b21353052bcc45091badecde0a4c213395b0f6d
```

**Firebase Service Account (в одну строку!):**
```env
FIREBASE_ADMIN_KEY={"type":"service_account","project_id":"my-new-home-design-app","private_key_id":"1234567890abcdef","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@my-new-home-design-app.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xyz%40my-new-home-design-app.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

**Frontend Firebase Config:**
```env
REACT_APP_API_KEY=AIzaSyC3iEskjgqXA3BTezc4Kg8zUuOnnch3I_U
REACT_APP_AUTH_DOMAIN=my-new-home-design-app.firebaseapp.com
REACT_APP_PROJECT_ID=my-new-home-design-app
REACT_APP_STORAGE_BUCKET=my-new-home-design-app.firebasestorage.app
REACT_APP_MESSAGING_SENDER_ID=874060215664
REACT_APP_APP_ID=1:874060215664:web:a6b849473b3a4535cfcbb5
```

### **6️⃣ Деплой**
- Нажмите **"Deploy"**
- Ждите 2-5 минут
- Получите URL приложения

---

## 🖥️ CLI Deployment (Advanced)

Если хотите использовать командную строку:

```bash
# 1. Логин (откроется браузер)
vercel login

# 2. Деплой
vercel

# 3. Ответить на вопросы:
# ? Set up and deploy "NeuroDecor"? Y  
# ? Which scope? [your-account]
# ? Link to existing project? N
# ? What's your project's name? neurodecor-ai-platform
# ? In which directory is your code located? ./

# 4. Production деплой
vercel --prod
```

---

## 📱 Expected Results

**После успешного деплоя получите:**

- **Main App**: `https://neurodecor-ai-platform.vercel.app` 
- **API Health**: `https://neurodecor-ai-platform.vercel.app/health`
- **Transform API**: `https://neurodecor-ai-platform.vercel.app/transform`
- **Payment API**: `https://neurodecor-ai-platform.vercel.app/api/create-payment`

---

## 🧪 Testing Deployment

### **1. Health Check**
```bash
curl https://your-app.vercel.app/health
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

### **2. Frontend Test**
- Откройте главную страницу
- Проверьте загрузку без ошибок
- Попробуйте авторизацию через Google

### **3. Image Upload Test**
- Загрузите картинку комнаты
- Выберите стиль дизайна
- Проверьте трансформацию

---

## 🔧 Troubleshooting

**Build Errors:**
- Проверьте все environment переменные
- Убедитесь что Firebase JSON в одну строку
- Проверьте настройки Build Command

**Function Timeout (10s limit):**
- Большие изображения могут превышать лимит
- Рассмотрите Pro план ($20/месяц) для 30s timeout

**CORS Errors:**
- Проверьте правильность API URL
- Убедитесь что backend и frontend развернуты

---

## ✅ Success Checklist

- ✅ Проект импортирован в Vercel
- ✅ Build settings настроены
- ✅ Environment переменные добавлены
- ✅ Деплой успешно завершен
- ✅ Health check возвращает "OK"
- ✅ Frontend загружается
- ✅ API endpoints работают

**Время деплоя: 3-5 минут** ⚡

---

**Готово к запуску!** 🎉