const request = require('supertest');
const { mockWayForPayCallback, createCryptoMock } = require('../mocks/externalServices');

// Mock dependencies
jest.mock('../../database/db');
jest.mock('../../auth/auth');
jest.mock('crypto');

const mockDb = require('../../database/db');
const mockAuth = require('../../auth/auth');
const crypto = require('crypto');

describe('Payment Integration Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    // Set up environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.WAYFORPAY_MERCHANT_ACCOUNT = 'test_merchant';
    process.env.WAYFORPAY_MERCHANT_SECRET_KEY = 'test_secret_key';
    
    // Mock crypto
    const mockCryptoFunctions = createCryptoMock();
    crypto.createHmac = mockCryptoFunctions.createHmac;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock database initialization
    mockDb.init = jest.fn().mockResolvedValue();
    mockDb.health = jest.fn().mockResolvedValue({ 
      status: 'healthy', 
      time: new Date().toISOString(),
      version: 'PostgreSQL'
    });
    
    // Mock query methods
    mockDb.query = jest.fn();
    mockDb.queryOne = jest.fn();
    mockDb.transaction = jest.fn();

    // Mock auth methods
    mockAuth.requireAuth = jest.fn((req, res, next) => {
      req.user = { id: 123, email: 'test@example.com' };
      next();
    });
    mockAuth.getUserById = jest.fn().mockResolvedValue({
      id: 123,
      email: 'test@example.com',
      credits: 50
    });

    // Require the server after mocking
    delete require.cache[require.resolve('../../server-postgres')];
    app = require('../../server-postgres');
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/create-payment', () => {
    it('should create a payment successfully', async () => {
      const mockTransaction = {
        id: 1,
        order_reference: 'WFP-prod_basic_10_credits-123-1234567890',
        amount: 1,
        status: 'pending'
      };

      mockDb.query.mockResolvedValue({ rows: [mockTransaction] });

      const response = await request(app)
        .post('/api/create-payment')
        .send({
          productId: 'prod_basic_10_credits'
        })
        .expect(200);

      expect(response.body).toHaveProperty('merchantAccount', 'test_merchant');
      expect(response.body).toHaveProperty('orderReference');
      expect(response.body).toHaveProperty('amount', 1);
      expect(response.body).toHaveProperty('currency', 'UAH');
      expect(response.body).toHaveProperty('serviceUrl');
      expect(response.body.serviceUrl).toContain('https://');
      expect(response.body.serviceUrl).toContain('/api/payment-callback');
    });

    it('should reject invalid product IDs', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send({
          productId: 'invalid_product'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid product');
    });

    it('should handle missing product ID', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid product');
    });

    it('should handle database errors during transaction creation', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/create-payment')
        .send({
          productId: 'prod_basic_10_credits'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create payment');
    });

    it('should generate correct merchant signature', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/create-payment')
        .send({
          productId: 'prod_basic_10_credits'
        })
        .expect(200);

      expect(response.body).toHaveProperty('merchantSignature');
      expect(crypto.createHmac).toHaveBeenCalledWith('md5', 'test_secret_key');
    });
  });

  describe('POST /api/payment-callback', () => {
    const mockTransaction = {
      id: 1,
      user_id: 123,
      order_reference: 'WFP-test-123',
      credits_added: 10,
      amount: '1.00',
      status: 'pending'
    };

    beforeEach(() => {
      // Mock successful database transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] })
        };
        await callback(mockClient);
      });
    });

    it('should process successful payment callback', async () => {
      const callbackData = mockWayForPayCallback('Approved', 'WFP-test-123');
      mockDb.queryOne.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(200);

      expect(response.body).toHaveProperty('orderReference', 'WFP-test-123');
      expect(response.body).toHaveProperty('status', 'accept');
      expect(response.body).toHaveProperty('time');
      expect(response.body).toHaveProperty('signature');

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should handle declined payment callback', async () => {
      const callbackData = mockWayForPayCallback('Declined', 'WFP-test-123');
      mockDb.queryOne.mockResolvedValue(mockTransaction);
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(200);

      expect(response.text).toBe('Callback received');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transactions SET status'),
        ['declined', JSON.stringify(callbackData), 'WFP-test-123']
      );
    });

    it('should reject callback without order reference', async () => {
      const callbackData = {
        transactionStatus: 'Approved',
        amount: 1
        // orderReference missing
      };

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payment data');
    });

    it('should handle non-existent transaction', async () => {
      const callbackData = mockWayForPayCallback('Approved', 'NON-EXISTENT-123');
      mockDb.queryOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Transaction not found');
    });

    it('should handle database transaction failures during processing', async () => {
      const callbackData = mockWayForPayCallback('Approved', 'WFP-test-123');
      mockDb.queryOne.mockResolvedValue(mockTransaction);
      mockDb.transaction.mockRejectedValue(new Error('Transaction failed'));

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Payment processing failed');
    });

    it('should handle various payment status formats', async () => {
      const testCases = [
        { status: 'Approved', expectSuccess: true },
        { status: 'approved', expectSuccess: false }, // Only 'Approved' should work
        { status: 'APPROVED', expectSuccess: false },
        { status: 'Declined', expectSuccess: false },
        { status: 'Failed', expectSuccess: false },
        { status: 'Pending', expectSuccess: false }
      ];

      for (const testCase of testCases) {
        mockDb.queryOne.mockResolvedValue(mockTransaction);
        mockDb.query.mockResolvedValue({ rows: [] });

        const callbackData = mockWayForPayCallback(testCase.status, 'WFP-test-status');
        
        const response = await request(app)
          .post('/api/payment-callback')
          .send(callbackData);

        if (testCase.expectSuccess) {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('status', 'accept');
        } else {
          expect(response.status).toBe(200);
          expect(response.text).toBe('Callback received');
        }
      }
    });

    it('should generate correct response signature for approved payments', async () => {
      const callbackData = mockWayForPayCallback('Approved', 'WFP-signature-test');
      mockDb.queryOne.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(200);

      expect(response.body).toHaveProperty('signature');
      expect(crypto.createHmac).toHaveBeenCalledWith('md5', 'test_secret_key');
    });

    it('should handle concurrent callback processing', async () => {
      const callbackData = mockWayForPayCallback('Approved', 'WFP-concurrent-123');
      mockDb.queryOne.mockResolvedValue(mockTransaction);

      // Simulate concurrent requests
      const promises = Array(3).fill().map(() => 
        request(app)
          .post('/api/payment-callback')
          .send(callbackData)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed, but database transaction should ensure atomicity
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'accept');
      });
    });
  });

  describe('Payment System Edge Cases', () => {
    it('should handle malformed callback data gracefully', async () => {
      const malformedData = {
        orderReference: 'WFP-test-123',
        transactionStatus: null,
        amount: 'invalid'
      };

      mockDb.queryOne.mockResolvedValue({
        order_reference: 'WFP-test-123',
        status: 'pending'
      });

      const response = await request(app)
        .post('/api/payment-callback')
        .send(malformedData)
        .expect(200);

      // Should handle null status as declined
      expect(response.text).toBe('Callback received');
    });

    it('should handle very large order references', async () => {
      const longOrderRef = 'WFP-' + 'x'.repeat(200);
      const callbackData = mockWayForPayCallback('Approved', longOrderRef);
      
      mockDb.queryOne.mockResolvedValue({
        order_reference: longOrderRef,
        user_id: 123,
        credits_added: 10
      });

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(200);

      expect(response.body).toHaveProperty('orderReference', longOrderRef);
    });

    it('should handle special characters in callback data', async () => {
      const callbackData = {
        orderReference: 'WFP-test-спеціальні-символи-123',
        transactionStatus: 'Approved',
        email: 'test@домен.укр',
        clientName: 'Тест Користувач'
      };

      mockDb.queryOne.mockResolvedValue({
        order_reference: 'WFP-test-спеціальні-символи-123',
        user_id: 123,
        credits_added: 10
      });

      const response = await request(app)
        .post('/api/payment-callback')
        .send(callbackData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'accept');
    });
  });
});