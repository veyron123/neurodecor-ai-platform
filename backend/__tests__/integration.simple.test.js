const request = require('supertest');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

// Simple test app without Firebase dependencies
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // File upload configuration
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const isValidType = ['image/jpeg', 'image/png'].includes(file.mimetype);
      cb(isValidType ? null : new Error('Only JPG and PNG files allowed'), isValidType);
    }
  });

  // Test routes
  app.get('/health', (req, res) => res.json({
    status: 'OK', 
    timestamp: new Date().toISOString(),
    hasFlux: !!process.env.BFL_API_KEY
  }));

  app.post('/transform', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    const { roomType, furnitureStyle } = req.body;
    if (!roomType || !furnitureStyle) {
      return res.status(400).json({ error: 'Room type and style required' });
    }

    // Simulate processing in demo mode
    await new Promise(resolve => setTimeout(resolve, 100));
    res.setHeader('Content-Type', req.file.mimetype);
    res.send(req.file.buffer);
  });

  app.post('/api/create-payment', (req, res) => {
    const { userId, productId } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    res.json({
      orderReference: `WFP-${productId}-${userId}-${Date.now()}`,
      merchantAccount: 'test-merchant',
      amount: 1400
    });
  });

  // Error handling
  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (10MB max)' });
    }
    if (error.message.includes('Only JPG and PNG')) {
      return res.status(400).json({ error: 'Only JPG/PNG files allowed' });
    }
    res.status(500).json({ error: 'Server error' });
  });

  return app;
};

describe('Simple Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check Integration', () => {
    test('should return complete health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        hasFlux: expect.any(Boolean)
      });
    });
  });

  describe('Image Transform Integration', () => {
    test('should handle complete transform flow', async () => {
      const testImageBuffer = Buffer.from('test-image-data');
      
      const response = await request(app)
        .post('/transform')
        .attach('image', testImageBuffer, 'test.jpg')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(testImageBuffer);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/transform')
        .field('roomType', 'bedroom');
        // Missing image and furnitureStyle

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No image uploaded');
    });

    test('should validate image upload', async () => {
      const response = await request(app)
        .post('/transform')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');
        // No image attached

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No image uploaded');
    });
  });

  describe('Payment Integration', () => {
    test('should handle payment creation flow', async () => {
      const paymentData = {
        userId: 'test-user-123',
        productId: 'prod_basic_8_credits'
      };

      const response = await request(app)
        .post('/api/create-payment')
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        orderReference: expect.stringContaining('WFP-prod_basic_8_credits-test-user-123'),
        merchantAccount: 'test-merchant',
        amount: 1400
      });
    });

    test('should validate payment data', async () => {
      const response = await request(app)
        .post('/api/create-payment')
        .send({ userId: 'test-user' });
        // Missing productId

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle file size limit', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      const response = await request(app)
        .post('/transform')
        .attach('image', largeBuffer, 'large.jpg')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File too large (10MB max)');
    });

    test('should handle unsupported file types', async () => {
      const testBuffer = Buffer.from('test-data');
      
      const response = await request(app)
        .post('/transform')
        .attach('image', testBuffer, 'test.gif')
        .field('roomType', 'bedroom')
        .field('furnitureStyle', 'scandinavian');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Only JPG/PNG files allowed');
    });
  });
});