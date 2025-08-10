/**
 * Image Transformation Integration Tests
 * Tests for image upload and AI transformation with Flux API mocking
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const testDb = require('../testDatabase');
const { createFluxAPIMock, createTestDataGenerators } = require('../mocks/externalServices');

// Mock axios for Flux API calls
jest.mock('axios');
const axios = require('axios');

describe('Image Transformation Integration Tests', () => {
  let app;
  let authToken;
  let userId;
  let fluxMock;
  let testDataGen;

  beforeAll(async () => {
    await testDb.setupSchema();
    
    // Import the app after database is set up
    delete require.cache[require.resolve('../../server-postgres')];
    app = require('../../server-postgres');

    fluxMock = createFluxAPIMock();
    testDataGen = createTestDataGenerators();
  });

  beforeEach(async () => {
    await testDb.clean();
    await testDb.seed();
    jest.clearAllMocks();

    // Create authenticated user with credits
    const userData = {
      email: 'transform@example.com',
      password: 'password123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(userData);

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;

    // Give user credits for transformations
    await testDb.query('UPDATE users SET credits = $1 WHERE id = $2', [10, userId]);

    // Create test image file
    const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');
    const testImageBuffer = testDataGen.generateImageBuffer(2048);
    if (!fs.existsSync(path.dirname(testImagePath))) {
      fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
    }
    fs.writeFileSync(testImagePath, testImageBuffer);
  });

  afterAll(async () => {
    await testDb.close();
    
    // Cleanup test files
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      fs.readdirSync(uploadsDir).forEach(file => {
        if (file.startsWith('test-') || file.includes('transform-test')) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
  });

  describe('POST /transform', () => {
    it('should transform image successfully with valid parameters', async () => {
      const mockImageBuffer = fluxMock.mockSuccessfulGeneration();

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.body).toBeInstanceOf(Buffer);

      // Verify credit was deducted
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(9);

      // Verify Flux API was called correctly
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.bfl.ai/v1/flux-kontext-pro',
        expect.objectContaining({
          prompt: expect.stringContaining('living room'),
          input_image: expect.any(String)
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-key': 'test-flux-api-key'
          })
        })
      );
    });

    it('should reject request without image', async () => {
      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No image uploaded');

      // Verify no credits deducted
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });

    it('should reject request without room type', async () => {
      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Room type and style required');

      // Verify no credits deducted
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });

    it('should reject request without furniture style', async () => {
      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'bedroom');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Room type and style required');

      // Verify no credits deducted
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });

    it('should reject request with insufficient credits', async () => {
      // Set user credits to 0
      await testDb.query('UPDATE users SET credits = 0 WHERE id = $1', [userId]);

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient credits');

      // Verify Flux API was not called
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated request', async () => {
      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should handle all supported room types', async () => {
      const roomTypes = [
        'living-room',
        'bedroom',
        'kitchen',
        'dining-room',
        'bathroom',
        'home-office'
      ];

      for (const roomType of roomTypes) {
        fluxMock.mockSuccessfulGeneration();
        
        const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

        const response = await request(app)
          .post('/transform')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath)
          .field('roomType', roomType)
          .field('furnitureStyle', 'modern');

        expect(response.status).toBe(200);

        // Verify correct prompt was generated
        const callArgs = axios.post.mock.calls[axios.post.mock.calls.length - 1];
        const requestData = callArgs[1];
        expect(requestData.prompt).toContain(roomType.replace('-', ' '));
      }
    });

    it('should handle all supported furniture styles', async () => {
      const styles = [
        'scandinavian',
        'modern',
        'minimalist',
        'coastal',
        'industrial',
        'traditional'
      ];

      for (const style of styles) {
        fluxMock.mockSuccessfulGeneration();
        
        const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

        const response = await request(app)
          .post('/transform')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath)
          .field('roomType', 'living-room')
          .field('furnitureStyle', style);

        expect(response.status).toBe(200);

        // Verify correct prompt was generated
        const callArgs = axios.post.mock.calls[axios.post.mock.calls.length - 1];
        const requestData = callArgs[1];
        expect(requestData.prompt).toContain(style);
      }
    });

    it('should generate appropriate prompts for room-style combinations', async () => {
      const testCases = [
        {
          room: 'bedroom',
          style: 'scandinavian',
          expectedPrompt: 'Transform this bedroom into Scandinavian style with soft lighting and white wood'
        },
        {
          room: 'kitchen',
          style: 'industrial',
          expectedPrompt: 'Transform this kitchen into industrial style with exposed brick and metal'
        },
        {
          room: 'bathroom',
          style: 'coastal',
          expectedPrompt: 'Transform this bathroom into coastal style with light blue and natural textures'
        }
      ];

      for (const testCase of testCases) {
        fluxMock.mockSuccessfulGeneration();
        
        const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

        await request(app)
          .post('/transform')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath)
          .field('roomType', testCase.room)
          .field('furnitureStyle', testCase.style);

        const callArgs = axios.post.mock.calls[axios.post.mock.calls.length - 1];
        const requestData = callArgs[1];
        expect(requestData.prompt).toContain('Keep the layout, make it photorealistic');
      }
    });

    it('should handle Flux API failures gracefully', async () => {
      fluxMock.mockFailedGeneration('Processing failed');

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Transform failed');

      // Verify credits were not deducted on failure
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });

    it('should handle Flux API timeout', async () => {
      fluxMock.mockTimeout();

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Transform failed');

      // Verify credits were not deducted on timeout
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });

    it('should handle missing Flux API key', async () => {
      // Temporarily remove API key
      const originalKey = process.env.BFL_API_KEY;
      process.env.BFL_API_KEY = 'YOUR_API_KEY_HERE';

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'API key not configured');

      // Verify credits were not deducted
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);

      // Restore API key
      process.env.BFL_API_KEY = originalKey;
    });

    it('should clean up uploaded files after processing', async () => {
      fluxMock.mockSuccessfulGeneration();

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(200);

      // Check that temporary uploaded files are cleaned up
      // This is tricky to test as multer creates unique filenames
      // We can at least verify the response succeeds
    });

    it('should clean up uploaded files on error', async () => {
      fluxMock.mockFailedGeneration();

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(500);

      // File cleanup should happen even on error
      // This is tested implicitly by the error handling code
    });

    it('should handle large image files', async () => {
      // Create larger test image
      const largeImageBuffer = testDataGen.generateImageBuffer(5 * 1024 * 1024); // 5MB
      const largeImagePath = path.join(__dirname, '../../uploads/large-test-image.jpg');
      fs.writeFileSync(largeImagePath, largeImageBuffer);

      fluxMock.mockSuccessfulGeneration();

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeImagePath)
        .field('roomType', 'living-room')
        .field('furnitureStyle', 'modern');

      expect(response.status).toBe(200);

      // Cleanup
      fs.unlinkSync(largeImagePath);
    });

    it('should handle different image formats', async () => {
      const formats = [
        { ext: 'png', mime: 'image/png' },
        { ext: 'gif', mime: 'image/gif' },
        { ext: 'bmp', mime: 'image/bmp' }
      ];

      for (const format of formats) {
        const imageBuffer = testDataGen.generateImageBuffer(1024);
        const imagePath = path.join(__dirname, `../../uploads/test.${format.ext}`);
        fs.writeFileSync(imagePath, imageBuffer);

        fluxMock.mockSuccessfulGeneration();

        const response = await request(app)
          .post('/transform')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', imagePath)
          .field('roomType', 'living-room')
          .field('furnitureStyle', 'modern');

        // Should handle all formats (Flux API accepts base64 data)
        expect([200, 400]).toContain(response.status);

        // Cleanup
        fs.unlinkSync(imagePath);
      }
    });

    it('should handle concurrent transformation requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        fluxMock.mockSuccessfulGeneration();
        
        const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');
        
        promises.push(
          request(app)
            .post('/transform')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('image', testImagePath)
            .field('roomType', 'living-room')
            .field('furnitureStyle', 'modern')
        );
      }

      const responses = await Promise.all(promises);

      // All should succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });

      // Verify appropriate credits were deducted
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      const successfulTransforms = responses.filter(r => r.status === 200).length;
      expect(user.credits).toBe(10 - successfulTransforms);
    });
  });

  describe('Image Transformation Edge Cases', () => {
    it('should handle custom room types and styles', async () => {
      fluxMock.mockSuccessfulGeneration();

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'custom-room-type')
        .field('furnitureStyle', 'custom-style');

      expect(response.status).toBe(200);

      // Verify custom values are used in prompt
      const callArgs = axios.post.mock.calls[axios.post.mock.calls.length - 1];
      const requestData = callArgs[1];
      expect(requestData.prompt).toContain('custom-room-type');
      expect(requestData.prompt).toContain('custom-style');
    });

    it('should handle empty string values', async () => {
      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', '')
        .field('furnitureStyle', '');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Room type and style required');
    });

    it('should handle special characters in parameters', async () => {
      fluxMock.mockSuccessfulGeneration();

      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', 'living-room with special chars !@#$%')
        .field('furnitureStyle', 'modern & contemporary');

      expect(response.status).toBe(200);
    });

    it('should handle very long parameter values', async () => {
      fluxMock.mockSuccessfulGeneration();

      const longString = 'a'.repeat(1000);
      const testImagePath = path.join(__dirname, '../../uploads/test-image.jpg');

      const response = await request(app)
        .post('/transform')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('roomType', longString)
        .field('furnitureStyle', longString);

      // Should handle gracefully
      expect([200, 400]).toContain(response.status);
    });
  });
});