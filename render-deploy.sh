#!/bin/bash

echo "🚀 Render.com Deployment Script"
echo "================================"

echo ""
echo "📋 Step 1: Create Render Account"
echo "Open: https://dashboard.render.com"
echo "Sign up with GitHub account"
echo ""
read -p "Press Enter when ready..."

echo ""
echo "📋 Step 2: Get API Key"
echo "1. Go to Settings -> API Keys"
echo "2. Click 'Create New API Key'"  
echo "3. Copy the API key"
echo ""
read -p "Enter your Render API Key: " API_KEY

echo ""
echo "📋 Step 3: Deploy Backend Service"
echo "Creating neurodecor-backend..."
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "neurodecor-backend",
    "type": "web_service",
    "repo": "https://github.com/veyron123/neurodecor-ai-platform",
    "branch": "master",
    "buildCommand": "cd backend && npm install",
    "startCommand": "cd backend && npm start",
    "envVars": [
      {"key": "NODE_ENV", "value": "production"},
      {"key": "PORT", "value": "10000"},
      {"key": "BFL_API_KEY", "value": "c06495ce-9a67-4a9d-b387-0b5b2dac9d28"},
      {"key": "WAYFORPAY_MERCHANT_ACCOUNT", "value": "www_neurodecor_site"},
      {"key": "WAYFORPAY_MERCHANT_SECRET_KEY", "value": "6b21353052bcc45091badecde0a4c213395b0f6d"}
    ]
  }'

echo ""
echo "📋 Step 4: Deploy Frontend Service"
echo "Creating neurodecor-frontend..."
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "neurodecor-frontend", 
    "type": "static_site",
    "repo": "https://github.com/veyron123/neurodecor-ai-platform",
    "branch": "master",
    "buildCommand": "cd frontend && npm install && npm run build",
    "publishPath": "./frontend/build",
    "envVars": [
      {"key": "REACT_APP_API_URL", "value": "https://neurodecor-backend.onrender.com"},
      {"key": "REACT_APP_API_KEY", "value": "AIzaSyC3iEskjgqXA3BTezc4Kg8zUuOnnch3I_U"},
      {"key": "REACT_APP_AUTH_DOMAIN", "value": "my-new-home-design-app.firebaseapp.com"},
      {"key": "REACT_APP_PROJECT_ID", "value": "my-new-home-design-app"},
      {"key": "REACT_APP_STORAGE_BUCKET", "value": "my-new-home-design-app.firebasestorage.app"},
      {"key": "REACT_APP_MESSAGING_SENDER_ID", "value": "874060215664"},
      {"key": "REACT_APP_APP_ID", "value": "1:874060215664:web:a6b849473b3a4535cfcbb5"}
    ]
  }'

echo ""
echo "✅ Deployment initiated!"
echo "Check status at: https://dashboard.render.com"
echo ""
echo "Expected URLs:"
echo "Backend:  https://neurodecor-backend.onrender.com"
echo "Frontend: https://neurodecor-frontend.onrender.com"
echo ""