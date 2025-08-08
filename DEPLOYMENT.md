# 🚀 NeuroDecor Deployment Guide - Render

## 📋 Deployment Overview

**NeuroDecor** is deployed as two separate services on Render:
- **Backend API** - Node.js service for image processing and payments
- **Frontend** - Static site for the React application

## 🛠️ Pre-Deployment Preparation

### 1. Repository Setup
Ensure your code is pushed to a GitHub repository that Render can access.

### 2. Environment Variables
Collect all required API keys and configuration values:

**Backend Environment Variables:**
- `BFL_API_KEY` - Flux.1 Kontext API key
- `WAYFORPAY_MERCHANT_ACCOUNT` - Payment system account
- `WAYFORPAY_MERCHANT_SECRET_KEY` - Payment system secret
- `FIREBASE_ADMIN_KEY` - Firebase service account JSON (as string)

**Frontend Environment Variables:**
- `REACT_APP_API_KEY` - Firebase web API key
- `REACT_APP_AUTH_DOMAIN` - Firebase auth domain
- `REACT_APP_PROJECT_ID` - Firebase project ID
- `REACT_APP_STORAGE_BUCKET` - Firebase storage bucket
- `REACT_APP_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `REACT_APP_APP_ID` - Firebase app ID

## 🚀 Step-by-Step Deployment

### Option 1: Blueprint Deployment (Recommended)

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account

2. **Deploy with Blueprint**
   - Click "New" → "Blueprint"
   - Connect to your repository
   - Select the `render.yaml` file
   - Click "Apply"

3. **Configure Environment Variables**
   - Go to each service settings
   - Add all required environment variables
   - Save changes

### Option 2: Manual Deployment

#### Deploy Backend Service

1. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure:
     ```
     Name: neurodecor-backend
     Environment: Node
     Build Command: cd backend && npm install
     Start Command: cd backend && npm start
     Plan: Free
     ```

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   BFL_API_KEY=your_flux_api_key
   WAYFORPAY_MERCHANT_ACCOUNT=your_merchant_account
   WAYFORPAY_MERCHANT_SECRET_KEY=your_secret_key
   FIREBASE_ADMIN_KEY={"type":"service_account",...}
   ```

3. **Configure Health Check**
   - Health Check Path: `/health`
   - Auto-Deploy: Yes

#### Deploy Frontend Service

1. **Create Static Site**
   - Click "New" → "Static Site"  
   - Connect your repository
   - Configure:
     ```
     Name: neurodecor-frontend
     Build Command: cd frontend && npm install && npm run build
     Publish Directory: ./frontend/build
     ```

2. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://neurodecor-backend.onrender.com
   REACT_APP_API_KEY=your_firebase_api_key
   REACT_APP_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_PROJECT_ID=your-project-id
   REACT_APP_STORAGE_BUCKET=your-project.firebasestorage.app
   REACT_APP_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_APP_ID=your_app_id
   ```

3. **Configure Redirects**
   Add redirect rules for SPA:
   ```
   /*    /index.html   200
   ```

## 🔧 Configuration Details

### Backend Configuration

**CORS Settings:**
The backend is configured to accept requests from:
- `http://localhost:3002` (development)
- `https://neurodecor-frontend.onrender.com` (production)
- `https://neurodecor.onrender.com` (custom domain)

**Health Check:**
Available at `/health` with comprehensive service status:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "services": {
    "firebase": true,
    "flux": true,
    "payments": true
  },
  "memory": { "used": "25MB", "total": "50MB" },
  "uptime": "3600s"
}
```

### Frontend Configuration

**API Integration:**
- Automatically detects production/development environment
- Uses `REACT_APP_API_URL` for backend communication
- Includes error handling for API failures

**SPA Routing:**
- All routes redirect to `index.html`
- React Router handles client-side navigation

## 🔐 Security Configuration

### Environment Variables Security
- All sensitive keys are stored as environment variables
- Firebase service account loaded from environment
- No secrets committed to repository

### CORS Protection
- Whitelist specific domains
- Credentials support enabled
- Origin validation

### File Upload Security
- File type validation (JPG/PNG only)
- File size limits (10MB)
- Content-type verification

## 📊 Monitoring & Logging

### Health Checks
- **Backend:** `/health` endpoint with service status
- **Frontend:** Static file availability

### Performance Monitoring
- Memory usage tracking
- Uptime monitoring
- API response times

### Error Handling
- Comprehensive error responses
- Structured logging
- Client-side error boundaries

## 🐛 Troubleshooting

### Common Issues

**Backend Not Starting:**
- Check environment variables are set
- Verify Firebase service account JSON is valid
- Check logs for specific error messages

**Frontend Build Errors:**
- Ensure all `REACT_APP_*` variables are set
- Check for missing dependencies
- Verify build command succeeds locally

**CORS Errors:**
- Verify frontend URL in backend CORS whitelist
- Check environment variable `REACT_APP_API_URL`
- Ensure HTTPS is used in production

**API Connection Issues:**
- Check backend service is running
- Verify API URL is correct
- Test health endpoint directly

### Debugging Commands

**Check Backend Health:**
```bash
curl https://neurodecor-backend.onrender.com/health
```

**Check Frontend:**
```bash
curl https://neurodecor-frontend.onrender.com
```

**View Logs in Render:**
- Go to service dashboard
- Click "Logs" tab
- Filter by log level

## 🔄 Deployment Workflow

### Automatic Deployments
- Push to main branch triggers auto-deploy
- Build process runs automatically
- Health checks verify deployment

### Manual Deployments  
- Use "Manual Deploy" in Render dashboard
- Select branch/commit to deploy
- Monitor deployment logs

### Rollback Process
- Use "Redeploy" with previous commit
- Environment variables preserved
- Zero-downtime deployment

## 📈 Scaling & Performance

### Free Tier Limitations
- **Backend:** 512MB RAM, sleeps after 15min inactivity
- **Frontend:** 100GB bandwidth/month
- **Storage:** 1GB persistent disk

### Optimization Tips
- Enable build caching
- Minimize bundle sizes
- Use compression for static files
- Implement CDN for images

## 🌐 Custom Domain Setup

1. **Add Custom Domain**
   - Go to service settings
   - Add custom domain
   - Update DNS records

2. **SSL Certificate**
   - Automatic Let's Encrypt SSL
   - HTTPS redirect enabled
   - Certificate auto-renewal

3. **Update Configuration**
   - Add domain to CORS whitelist
   - Update environment variables
   - Test all endpoints

## ✅ Post-Deployment Checklist

- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] API communication working
- [ ] File upload functionality
- [ ] Payment system integration
- [ ] Firebase authentication
- [ ] All environment variables set
- [ ] CORS configuration correct
- [ ] SSL certificate active
- [ ] Monitoring enabled

## 📞 Support

For deployment issues:
1. Check Render service logs
2. Verify environment variables
3. Test locally first
4. Contact Render support if needed

---

**Deployment Status:** ✅ **Production Ready**  
**Estimated Deploy Time:** 5-10 minutes  
**Auto-Deploy:** Enabled on main branch