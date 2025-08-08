#!/bin/bash

# Build script for NeuroDecor deployment

echo "🚀 Starting NeuroDecor build process..."

# Build Backend
echo "📦 Building Backend..."
cd backend
npm install
npm run build
echo "✅ Backend build completed"

# Build Frontend  
echo "🎨 Building Frontend..."
cd ../frontend
npm install
npm run build
echo "✅ Frontend build completed"

echo "🎉 Build process completed successfully!"
echo "📁 Frontend build available at: ./frontend/build"
echo "🚀 Backend ready to start with: npm start"