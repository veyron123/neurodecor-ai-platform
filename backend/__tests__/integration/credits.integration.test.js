const request = require('supertest');
const { createGoogleClientMock, mockFluxAPI, createAxiosMock } = require('../mocks/externalServices');

// Mock dependencies
jest.mock('../../database/db');
jest.mock('../../auth/auth');
jest.mock('axios');

const mockDb = require('../../database/db');
const mockAuth = require('../../auth/auth');
const axios = require('axios');

describe('Credits System Integration Tests', () => {
  let app;
  let authToken;
  let userId;

  beforeAll(async () => {
    await testDb.setupSchema();
    
    // Import the app after database is set up
    delete require.cache[require.resolve('../../server-postgres')];
    app = require('../../server-postgres');
  });

  beforeEach(async () => {
    await testDb.clean();
    await testDb.seed();

    // Create authenticated user for protected endpoints
    const userData = {
      email: 'credittest@example.com',
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

    // Give user some initial credits
    await testDb.query('UPDATE users SET credits = $1 WHERE id = $2', [10, userId]);
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('GET /api/credits', () => {
    it('should return user credits with valid authentication', async () => {
      const response = await request(app)
        .get('/api/credits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('credits', 10);
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/credits');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/credits')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should handle user with zero credits', async () => {
      // Set user credits to 0
      await testDb.query('UPDATE users SET credits = 0 WHERE id = $1', [userId]);

      const response = await request(app)
        .get('/api/credits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.credits).toBe(0);
    });

    it('should handle non-existent user with valid token', async () => {
      // Delete user but keep valid token structure
      await testDb.query('DELETE FROM users WHERE id = $1', [userId]);

      const response = await request(app)
        .get('/api/credits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.credits).toBe(0); // Fallback value
    });

    it('should return consistent data structure', async () => {
      const response = await request(app)
        .get('/api/credits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('credits');
      expect(response.body).toHaveProperty('userId');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.credits).toBe('number');
      expect(typeof response.body.userId).toBe('number');
    });
  });

  describe('POST /api/credits/deduct', () => {
    it('should deduct single credit successfully', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('creditsRemaining', 9);

      // Verify in database
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(9);

      // Verify credit usage was logged
      const usage = await testDb.queryOne(
        'SELECT * FROM credit_usage WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      expect(usage).toBeDefined();
      expect(usage.credits_used).toBe(1);
      expect(usage.operation_type).toBe('image_generation');
    });

    it('should deduct multiple credits', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 3 });

      expect(response.status).toBe(200);
      expect(response.body.creditsRemaining).toBe(7);

      // Verify in database
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(7);

      // Verify credit usage was logged
      const usage = await testDb.queryOne(
        'SELECT credits_used FROM credit_usage WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      expect(usage.credits_used).toBe(3);
    });

    it('should reject deduction with insufficient credits', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 15 }); // More than user has

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient credits');

      // Verify credits unchanged
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);

      // Verify no credit usage logged
      const usage = await testDb.queryOne(
        'SELECT * FROM credit_usage WHERE user_id = $1',
        [userId]
      );
      expect(usage).toBeNull();
    });

    it('should handle edge case: deduct exact credit amount', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 10 }); // Exact amount user has

      expect(response.status).toBe(200);
      expect(response.body.creditsRemaining).toBe(0);

      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .send({ credits: 1 });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should handle negative credit values', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: -5 });

      // Should either reject or treat as 0/1
      expect([200, 400]).toContain(response.status);
      
      // Verify credits didn't increase
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBeLessThanOrEqual(10);
    });

    it('should handle zero credit deduction', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 0 });

      expect(response.status).toBe(200);
      expect(response.body.creditsRemaining).toBe(10);

      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });

    it('should handle concurrent credit deductions', async () => {
      // Create multiple concurrent deduction requests
      const promises = [
        request(app).post('/api/credits/deduct').set('Authorization', `Bearer ${authToken}`).send({ credits: 3 }),
        request(app).post('/api/credits/deduct').set('Authorization', `Bearer ${authToken}`).send({ credits: 4 }),
        request(app).post('/api/credits/deduct').set('Authorization', `Bearer ${authToken}`).send({ credits: 2 })
      ];

      const responses = await Promise.allSettled(promises);

      // At least one should succeed, others may fail due to insufficient credits
      const successful = responses.filter(r => r.value?.status === 200);
      const failed = responses.filter(r => r.value?.status === 400);

      expect(successful.length).toBeGreaterThanOrEqual(1);

      // Verify final credit count makes sense
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBeGreaterThanOrEqual(0);
      expect(user.credits).toBeLessThan(10);
    });

    it('should log credit usage with metadata', async () => {
      await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 2 });

      const usage = await testDb.queryOne(
        'SELECT * FROM credit_usage WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      expect(usage).toBeDefined();
      expect(usage.credits_used).toBe(2);
      expect(usage.operation_type).toBe('image_generation');
      expect(usage.metadata).toBeDefined();
      expect(typeof usage.metadata).toBe('object');
      expect(usage.created_at).toBeInstanceOf(Date);
    });

    it('should handle very large credit deduction requests', async () => {
      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 999999 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient credits');

      // Verify credits unchanged
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(10);
    });
  });

  describe('Credit System Edge Cases', () => {
    it('should maintain credit integrity across multiple operations', async () => {
      const initialCredits = 10;

      // Perform multiple deductions
      const deductions = [2, 3, 1, 4];
      let expectedCredits = initialCredits;

      for (const deduction of deductions) {
        const response = await request(app)
          .post('/api/credits/deduct')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ credits: deduction });

        expectedCredits -= deduction;

        expect(response.status).toBe(200);
        expect(response.body.creditsRemaining).toBe(expectedCredits);

        // Verify database consistency
        const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
        expect(user.credits).toBe(expectedCredits);
      }

      // Verify total credit usage logged
      const totalUsage = await testDb.query(
        'SELECT SUM(credits_used) as total FROM credit_usage WHERE user_id = $1',
        [userId]
      );
      expect(parseInt(totalUsage.rows[0].total)).toBe(deductions.reduce((a, b) => a + b, 0));
    });

    it('should handle credit operations during user modifications', async () => {
      // Simulate user being modified while credit operation in progress
      const creditPromise = request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 1 });

      // Modify user concurrently
      await testDb.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);

      const response = await creditPromise;

      // Should still work correctly
      expect(response.status).toBe(200);
      expect(response.body.creditsRemaining).toBe(9);
    });

    it('should handle credit operations with database constraints', async () => {
      // Test that credits can't go below 0 due to database constraints
      await testDb.query('UPDATE users SET credits = 1 WHERE id = $1', [userId]);

      const response = await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 5 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient credits');

      // Verify credits didn't go negative
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      expect(user.credits).toBe(1);
    });

    it('should handle credit operations with invalid user states', async () => {
      // Deactivate user
      await testDb.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);

      const response = await request(app)
        .get('/api/credits')
        .set('Authorization', `Bearer ${authToken}`);

      // Should handle gracefully (may return 0 credits or error)
      expect([200, 400, 401]).toContain(response.status);
    });
  });

  describe('Credit Usage Tracking', () => {
    it('should track multiple credit operations', async () => {
      // Perform several credit operations
      await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 2 });

      await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 3 });

      // Check usage history
      const usageHistory = await testDb.query(
        'SELECT * FROM credit_usage WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );

      expect(usageHistory.rows).toHaveLength(2);
      expect(usageHistory.rows[0].credits_used).toBe(2);
      expect(usageHistory.rows[1].credits_used).toBe(3);
      expect(usageHistory.rows[0].operation_type).toBe('image_generation');
      expect(usageHistory.rows[1].operation_type).toBe('image_generation');
    });

    it('should include metadata in credit usage logs', async () => {
      await request(app)
        .post('/api/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 1 });

      const usage = await testDb.queryOne(
        'SELECT metadata FROM credit_usage WHERE user_id = $1',
        [userId]
      );

      expect(usage.metadata).toBeDefined();
      expect(typeof usage.metadata).toBe('object');
      expect(usage.metadata.timestamp).toBeDefined();
    });
  });
});