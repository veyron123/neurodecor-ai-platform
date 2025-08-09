# 🚀 NeuroDecor First Version - Render Deployment Guide

## 📋 Step-by-Step Deployment

### 1️⃣ GitHub Repository Ready ✅
- Repository: `https://github.com/veyron123/neurodecor-ai-platform`
- Branch: `first-version-deploy`
- Files: All ready with `render.yaml` blueprint

### 2️⃣ Render Deployment Steps

**Go to [render.com](https://render.com) and:**

1. **Create Account/Login**
   - Connect your GitHub account
   - Authorize repository access

2. **Blueprint Deployment**
   - Click "New" → "Blueprint"
   - Select repository: `veyron123/neurodecor-ai-platform`
   - Select branch: `first-version-deploy`
   - Render will detect `render.yaml`
   - Click "Apply"

### 3️⃣ Environment Variables Configuration

**Backend Service (neurodecor-backend):**
```env
NODE_ENV=production
PORT=10000
BFL_API_KEY=c06495ce-9a67-4a9d-b387-0b5b2dac9d28
WAYFORPAY_MERCHANT_ACCOUNT=www_neurodecor_site
WAYFORPAY_MERCHANT_SECRET_KEY=6b21353052bcc45091badecde0a4c213395b0f6d
FIREBASE_ADMIN_KEY={"type":"service_account","project_id":"my-new-home-design-app",...}
```

**Frontend Service (neurodecor-frontend):**
```env
REACT_APP_API_URL=https://neurodecor-backend.onrender.com
REACT_APP_API_KEY=AIzaSyC3iEskjgqXA3BTezc4Kg8zUuOnnch3I_U
REACT_APP_AUTH_DOMAIN=my-new-home-design-app.firebaseapp.com
REACT_APP_PROJECT_ID=my-new-home-design-app
REACT_APP_STORAGE_BUCKET=my-new-home-design-app.firebasestorage.app
REACT_APP_MESSAGING_SENDER_ID=874060215664
REACT_APP_APP_ID=1:874060215664:web:a6b849473b3a4535cfcbb5
```

### 4️⃣ Post-Deployment

**Expected URLs:**
- Backend API: `https://neurodecor-backend.onrender.com`
- Frontend App: `https://neurodecor-frontend.onrender.com`

**Health Check:**
- Test: `https://neurodecor-backend.onrender.com/health`
- Should return service status and uptime

### 5️⃣ First Version Features

**Available Endpoints:**
- `POST /transform` - Image transformation with AI
- `POST /api/create-payment` - Payment creation
- `POST /api/payment-callback` - Payment processing
- `GET /health` - Service health check

**Frontend Features:**
- Full React application with routing
- Multi-language support (EN/UK/RU)
- Firebase authentication
- Image upload and transformation
- Payment integration

## 🎯 Deployment Time: ~5 minutes

1. **Render Blueprint** (1 min) - Auto-detects configuration
2. **Environment Variables** (2 min) - Copy-paste values
3. **Build & Deploy** (2 min) - Automatic process
4. **Testing** (1 min) - Verify health checks

## ✅ Success Indicators

- ✅ Backend builds successfully
- ✅ Frontend builds and serves static files
- ✅ Health endpoint returns 200 OK
- ✅ Frontend loads without CORS errors
- ✅ Firebase connection works
- ✅ Flux.1 API integrated

## 🐛 Common Issues & Solutions

**Build Failures:**
- Check environment variables are set
- Verify Firebase service account JSON format
- Check API keys are valid

**CORS Errors:**
- Backend allows Frontend URL in CORS settings
- Check `REACT_APP_API_URL` points to correct backend URL

**Firebase Issues:**
- Ensure service account has proper permissions
- Check Firebase config in frontend matches project

---

**Ready to deploy!** 🚀