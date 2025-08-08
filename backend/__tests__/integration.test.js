const request = require('supertest');
const path = require('path');

// Mock external dependencies before importing the server
jest.mock('axios');
jest.mock('firebase-admin');

const axios = require('axios');

// Mock Firebase Admin
const mockFirestore = {
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
};

const mockAdmin = {
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  firestore: jest.fn(() => mockFirestore)
};

mockAdmin.firestore.FieldValue = {
  increment: jest.fn(value => ({ _increment: value }))
};

jest.doMock('firebase-admin', () => mockAdmin);

describe('Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Set environment variables
    process.env.PORT = 3001;
    process.env.BFL_API_KEY = 'test-api-key';
    process.env.WAYFORPAY_MERCHANT_ACCOUNT = 'test-merchant';
    process.env.WAYFORPAY_MERCHANT_SECRET_KEY = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset modules to get fresh app instance
    jest.resetModules();
    
    // Import app after mocks are set up
    app = require('../server.js');
  });

  describe('Complete Image Transformation Flow', () => {
    test('should handle end-to-end image transformation', async () => {
      // Mock Flux API responses
      axios.post.mockResolvedValueOnce({
        data: { polling_url: 'https://api.bfl.ai/v1/status/test-id' }
      });

      axios.get
        .mockResolvedValueOnce({
          data: { status: 'Processing' }
        })
        .mockResolvedValueOnce({
          data: { 
            status: 'Ready',
            result: { sample: 'https://example.com/generated.jpg' }
          }
        });

      axios.get.mockResolvedValueOnce({
        data: Buffer.from('generated-image-data'),
        responseType: 'arraybuffer'
      });

      // Create test image buffer
      const testImageBuffer = Buffer.from('test-image-data');
      
      const response = await request(app)
        .post('/transform')
        .attach('image', testImageBuffer, 'test.jpg')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.bfl.ai/v1/flux-kontext-pro',
        expect.objectContaining({
          prompt: expect.stringContaining('bedroom'),
          input_image: expect.any(String)
        }),
        expect.any(Object)
      );
    });

    test('should handle transformation timeout', async () => {
      // Mock Flux API to always return Processing status
      axios.post.mockResolvedValueOnce({
        data: { polling_url: 'https://api.bfl.ai/v1/status/test-id' }
      });

      // Mock multiple processing responses to simulate timeout
      axios.get.mockResolvedValue({
        data: { status: 'Processing' }
      });

      const testImageBuffer = Buffer.from('test-image-data');
      
      const response = await request(app)
        .post('/transform')
        .attach('image', testImageBuffer, 'test.jpg')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Transform failed');
      expect(response.body.details).toContain('timed out');
    }, 10000); // Increase timeout for this test
  });

  describe('Complete Payment Flow', () => {
    test('should handle payment creation and callback', async () => {
      // Step 1: Create payment
      const paymentData = {
        userId: 'test-user-123',
        productId: 'prod_basic_8_credits'
      };

      const createResponse = await request(app)
        .post('/api/create-payment')
        .send(paymentData);

      expect(createResponse.status).toBe(200);
      expect(createResponse.body).toHaveProperty('orderReference');
      expect(createResponse.body).toHaveProperty('merchantSignature');

      const orderReference = createResponse.body.orderReference;

      // Step 2: Simulate payment callback
      const callbackData = {
        [`${orderReference};Approved;1;UAH;test-signature`]: ''
      };

      const callbackResponse = await request(app)
        .post('/api/payment-callback')
        .send(callbackData);

      expect(callbackResponse.status).toBe(200);
      expect(callbackResponse.body).toHaveProperty('orderReference', orderReference);
      expect(callbackResponse.body).toHaveProperty('status', 'accept');

      // Verify Firebase operations were called
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(require('firebase-admin').firestore.FieldValue.increment).toHaveBeenCalledWith(8);
    });

    test('should reject invalid payment callback', async () => {
      const invalidCallbackData = {
        'invalid-format': ''
      };

      const response = await request(app)
        .post('/api/payment-callback')
        .send(invalidCallbackData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid payment data');
    });
  });

  describe('API Health and Error Handling', () => {
    test('should return healthy status when all services are configured', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        hasFlux: true
      });
    });

    test('should handle file upload errors', async () => {
      const response = await request(app)
        .post('/transform')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');
        // No image attached

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No image uploaded');
    });

    test('should handle missing transform parameters', async () => {
      const testImageBuffer = Buffer.from('test-image-data');
      
      const response = await request(app)
        .post('/transform')
        .attach('image', testImageBuffer, 'test.jpg');
        // Missing roomType and furnitureStyle

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Room type and style required');
    });

    test('should handle Flux API errors gracefully', async () => {
      // Mock Flux API to return error
      axios.post.mockRejectedValueOnce(new Error('Flux API Error'));

      const testImageBuffer = Buffer.from('test-image-data');
      
      const response = await request(app)
        .post('/transform')
        .attach('image', testImageBuffer, 'test.jpg')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Transform failed');
    });
  });
});