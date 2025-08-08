const request = require('supertest');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { mockImageBuffer, mockPaymentData } = require('../__mocks__/mockData');

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn(),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn()
          }))
        }))
      }))
    }))
  }),
  firestore: {
    FieldValue: {
      increment: jest.fn(value => ({ _increment: value }))
    }
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Simple test routes
  app.get('/health', (req, res) => res.json({
    status: 'OK', 
    timestamp: new Date().toISOString(),
    hasFlux: !!process.env.BFL_API_KEY
  }));

  app.post('/api/create-payment', (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    res.json({ orderReference: `WFP-${productId}-${userId}-${Date.now()}` });
  });

  return app;
};

describe('Backend API Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('hasFlux');
    });

    test('should return valid timestamp', async () => {
      const response = await request(app).get('/health');
      
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('POST /api/create-payment', () => {
    test('should create payment with valid data', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send(mockPaymentData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderReference');
      expect(response.body.orderReference).toContain(mockPaymentData.productId);
      expect(response.body.orderReference).toContain(mockPaymentData.userId);
    });

    test('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send({ productId: 'prod_basic_8_credits' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid request data');
    });

    test('should return 400 for missing productId', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send({ userId: 'test-user-123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid request data');
    });

    test('should return 400 for empty request', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid request data');
    });
  });
});