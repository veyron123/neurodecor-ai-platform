# 🏠 NeuroDecor - AI Interior Design Platform

**Transform your rooms with AI-powered interior design**

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)](https://render.com)
[![Tests](https://img.shields.io/badge/tests-74%20passing-success)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-100%25%20utilities-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

## 🌟 Features

- 🎯 **AI-Powered Transformation** - Flux.1 Kontext для реалистичных дизайнов
- 🎨 **6 Interior Styles** - Scandinavian, Modern, Minimalist, Coastal, Industrial, Traditional
- 🏠 **6 Room Types** - Bedroom, Living Room, Kitchen, Dining Room, Bathroom, Home Office
- 🔐 **Secure Authentication** - Firebase с Google OAuth
- 💳 **Credit System** - WayForPay интеграция для украинского рынка
- 🌐 **Multilingual** - EN/UK/RU локализация
- 📱 **Responsive Design** - Адаптивная верстка для всех устройств
- 🧪 **Fully Tested** - 74 теста с 100% покрытием утилит

## 🚀 Quick Start

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd NeuroDecor

# Install all dependencies
npm run install:all

# Start development servers
npm run dev:backend   # Terminal 1 (port 3001)
npm run dev:frontend  # Terminal 2 (port 3002)
```

### Production Deployment
```bash
# Check deployment readiness
npm run deploy:check

# Deploy to Render (see DEPLOYMENT.md)
# Use render.yaml blueprint for one-click deploy
```

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── server.js              # Main server with KISS principles
├── __tests__/            # Comprehensive test suite  
├── __mocks__/            # Mock data for testing
└── serviceAccountKey.json # Firebase credentials
```

**Key Features:**
- Simplified API endpoints (health, transform, payments)
- Firebase Admin SDK integration
- Flux.1 Kontext AI processing
- CORS configuration for production
- Comprehensive error handling

### Frontend (React.js)
```
frontend/src/
├── components/
│   ├── SimpleRoomTransformer.js  # Main UI component
│   └── __tests__/               # Component tests
├── utils/
│   ├── constants.js             # App constants
│   ├── api.js                   # API utilities
│   ├── helpers.js               # Helper functions
│   └── __tests__/              # 100% utility coverage
└── firebase.js                  # Firebase config
```

**Key Features:**
- KISS-принцип в компонентах
- Модульная архитектура утилит
- React Hooks для состояния
- i18next для локализации

## 🧪 Testing

**Backend Tests (Jest + Supertest):**
- ✅ 27 tests - API endpoints, utilities, integration flows
- ✅ Health check, image processing, payments
- ✅ Error handling and validation

**Frontend Tests (React Testing Library):**
- ✅ 47 tests - utilities and helpers
- ✅ 100% coverage for api.js, helpers.js, constants.js
- ✅ Component interaction testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:backend
npm run test:frontend
```

## 🌐 Deployment

### Render.com (Recommended)
**One-click deployment using Blueprint:**

1. Push code to GitHub
2. Connect to Render
3. Use `render.yaml` blueprint
4. Set environment variables
5. Deploy automatically

**URLs after deployment:**
- Backend: `https://neurodecor-backend.onrender.com`
- Frontend: `https://neurodecor-frontend.onrender.com`

**Quick Deploy Commands:**
```bash
npm run deploy:prepare  # Install, test, check readiness
npm run deploy:check    # Verify deployment configuration
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔑 Environment Variables

### Backend Production
```env
NODE_ENV=production
PORT=10000
BFL_API_KEY=your_flux_api_key
WAYFORPAY_MERCHANT_ACCOUNT=merchant_account
WAYFORPAY_MERCHANT_SECRET_KEY=secret_key
FIREBASE_ADMIN_KEY={"type":"service_account",...}
```

### Frontend Production
```env
REACT_APP_API_URL=https://neurodecor-backend.onrender.com
REACT_APP_API_KEY=firebase_api_key
REACT_APP_AUTH_DOMAIN=project.firebaseapp.com
REACT_APP_PROJECT_ID=project-id
# ... other Firebase config
```

## 📊 API Documentation

### Core Endpoints

**Health Check**
```http
GET /health
Response: { status: "OK", services: {...}, uptime: "3600s" }
```

**Image Transformation**
```http
POST /transform
Content-Type: multipart/form-data
Body: { image: File, roomType: string, furnitureStyle: string }
Response: Transformed image blob
```

**Payment Creation**
```http
POST /api/create-payment
Body: { userId: string, productId: string }
Response: { orderReference: string, merchantSignature: string }
```

## 💳 Credit System

**Available Packages:**
- 🟢 **Basic**: 8 credits - 1 UAH
- 🟡 **Standard**: 20 credits - 1400 UAH  
- 🔴 **Professional**: 60 credits - 3200 UAH

**Usage:**
- 1 credit = 1 room transformation
- Credits stored in Firebase per user
- WayForPay integration for Ukrainian market

## 🛠️ Development

### Project Scripts
```bash
# Development
npm run dev:backend      # Start backend dev server
npm run dev:frontend     # Start frontend dev server

# Building
npm run build           # Build frontend for production
npm run build:backend   # Prepare backend
npm run build:frontend  # Build React app

# Testing
npm test                # Run all tests
npm run test:coverage   # Generate coverage reports

# Deployment
npm run deploy:check    # Verify deployment readiness
npm run deploy:prepare  # Full pre-deployment workflow
```

### Code Quality
- **KISS Principles** - Keep It Simple, Stupid
- **Test Coverage** - 100% for critical utilities
- **Error Handling** - Comprehensive validation
- **TypeScript Ready** - JSDoc annotations

## 📚 Documentation

- [📖 DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [⚡ QUICK_DEPLOY.md](QUICK_DEPLOY.md) - 5-minute deploy guide  
- [🧪 TESTING_REPORT.md](TESTING_REPORT.md) - Test coverage report
- [🔧 KISS_REFACTORING.md](KISS_REFACTORING.md) - Code optimization details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

**Code Style:**
- Follow KISS principles
- Write tests for new features
- Update documentation
- Use semantic commit messages

## 🐛 Troubleshooting

**Common Issues:**

- **CORS Errors**: Check `REACT_APP_API_URL` and backend CORS config
- **Build Failures**: Verify all environment variables are set
- **Test Failures**: Run `npm run deploy:check` for diagnostics
- **Firebase Issues**: Check service account JSON format

**Debug Commands:**
```bash
# Check backend health
curl http://localhost:3001/health

# Test API connection
npm run test:backend

# Verify build
npm run deploy:prepare
```

## 📊 Project Stats

- **Lines of Code**: ~2000 (60% reduction after KISS refactoring)
- **Test Coverage**: 74 tests passing, 100% utilities
- **Dependencies**: Minimal, production-ready
- **Performance**: <2s backend tests, <4s frontend tests
- **Deployment**: One-click via Render blueprint

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by NeuroDecor Team**  
🚀 **Ready for Production** | 🧪 **Fully Tested** | ⚡ **One-Click Deploy**