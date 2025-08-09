@echo off
echo 🚀 Render.com Deployment Script
echo ================================

echo.
echo 📋 Step 1: Create Render Account
echo Open: https://dashboard.render.com
echo Sign up with GitHub account
echo.
pause

echo.
echo 📋 Step 2: Get API Key
echo 1. Go to Settings -> API Keys
echo 2. Click "Create New API Key"  
echo 3. Copy the API key
echo.
set /p API_KEY="Enter your Render API Key: "

echo.
echo 📋 Step 3: Deploy Backend Service
echo Creating neurodecor-backend...
curl -X POST https://api.render.com/v1/services ^
  -H "Authorization: Bearer %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"neurodecor-backend\",\"type\":\"web_service\",\"repo\":\"https://github.com/veyron123/neurodecor-ai-platform\",\"branch\":\"master\",\"buildCommand\":\"cd backend && npm install\",\"startCommand\":\"cd backend && npm start\",\"envVars\":[{\"key\":\"NODE_ENV\",\"value\":\"production\"},{\"key\":\"PORT\",\"value\":\"10000\"},{\"key\":\"BFL_API_KEY\",\"value\":\"c06495ce-9a67-4a9d-b387-0b5b2dac9d28\"}]}"

echo.
echo 📋 Step 4: Deploy Frontend Service  
echo Creating neurodecor-frontend...
curl -X POST https://api.render.com/v1/services ^
  -H "Authorization: Bearer %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"neurodecor-frontend\",\"type\":\"static_site\",\"repo\":\"https://github.com/veyron123/neurodecor-ai-platform\",\"branch\":\"master\",\"buildCommand\":\"cd frontend && npm install && npm run build\",\"publishPath\":\"./frontend/build\"}"

echo.
echo ✅ Deployment initiated!
echo Check status at: https://dashboard.render.com
echo.
pause