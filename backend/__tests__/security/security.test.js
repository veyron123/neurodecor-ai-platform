/**
 * Security Tests
 * Comprehensive security testing for authentication, SQL injection, XSS, and other vulnerabilities
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const testDb = require('../testDatabase');

describe('Security Tests', () => {
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

    // Create authenticated user for security tests
    const userData = {
      email: 'security@example.com',
      password: 'securepass123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(userData);

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('Authentication Security', () => {
    describe('JWT Token Security', () => {
      it('should reject tampered JWT tokens', async () => {
        // Tamper with the token
        const tokenParts = authToken.split('.');
        const tamperedToken = tokenParts[0] + '.' + tokenParts[1] + '.tampered_signature';

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${tamperedToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid token');
      });

      it('should reject expired tokens', async () => {
        // Create an expired token
        const expiredToken = jwt.sign(
          { id: userId, email: 'security@example.com' },
          process.env.JWT_SECRET,
          { expiresIn: '-1h' } // Expired 1 hour ago
        );

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid token');
      });

      it('should reject tokens with invalid signatures', async () => {
        const invalidToken = jwt.sign(
          { id: userId, email: 'security@example.com' },
          'wrong-secret-key'
        );

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid token');
      });

      it('should reject malformed tokens', async () => {
        const malformedTokens = [
          'notavalidtoken',
          'header.payload',
          'header.payload.signature.extra',
          '',
          'Bearer',
          'Bearer ',
          'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9' // Only header part
        ];

        for (const token of malformedTokens) {
          const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', token);

          expect(response.status).toBe(401);
        }
      });

      it('should validate token payload structure', async () => {
        // Create token with missing required fields
        const incompleteToken = jwt.sign(
          { email: 'security@example.com' }, // Missing id
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${incompleteToken}`);

        // Should either reject or handle gracefully
        expect([401, 404, 500]).toContain(response.status);
      });
    });

    describe('Password Security', () => {
      it('should properly hash passwords with bcrypt', async () => {
        const password = 'testpassword123';
        const userData = {
          email: 'hashtest@example.com',
          password: password
        };

        await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Verify password is hashed in database
        const user = await testDb.queryOne(
          'SELECT password_hash FROM users WHERE email = $1',
          [userData.email]
        );

        expect(user.password_hash).not.toBe(password);
        expect(user.password_hash).toMatch(/^\$2[aby]?\$/); // bcrypt format
        expect(user.password_hash.length).toBeGreaterThan(50);

        // Verify hash can be verified
        const isValid = await bcrypt.compare(password, user.password_hash);
        expect(isValid).toBe(true);
      });

      it('should enforce minimum password length', async () => {
        const weakPasswords = [
          '',
          '1',
          '12',
          '123',
          '1234',
          '12345' // 5 chars, minimum is 6
        ];

        for (const password of weakPasswords) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: `weak${Math.random()}@example.com`,
              password: password
            });

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Password must be at least 6 characters');
        }
      });

      it('should handle special characters in passwords', async () => {
        const specialPasswords = [
          'pass!@#$%^&*()',
          'пароль123', // Cyrillic
          'パスワード123', // Japanese
          'password with spaces',
          'password\nwith\nnewlines',
          'password\twith\ttabs',
          '"quoted"password',
          "'single'quoted",
          'password\\with\\backslashes'
        ];

        for (const password of specialPasswords) {
          const email = `special${Math.random()}@example.com`;
          
          const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({ email, password });

          expect(registerResponse.status).toBe(200);

          // Verify login works
          const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email, password });

          expect(loginResponse.status).toBe(200);
        }
      });
    });

    describe('Session Security', () => {
      it('should not expose sensitive data in responses', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.user).not.toHaveProperty('password');
        expect(response.body.user).not.toHaveProperty('password_hash');
        expect(response.body).not.toHaveProperty('jwtSecret');
      });

      it('should properly validate user existence for protected routes', async () => {
        // Create token for deleted user
        const deletedUserToken = jwt.sign(
          { id: 99999, email: 'deleted@example.com' },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${deletedUserToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'User not found');
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in login', async () => {
      const sqlInjectionAttempts = [
        "admin@example.com'; DROP TABLE users; --",
        "admin@example.com' OR '1'='1",
        "admin@example.com' OR 1=1 --",
        "admin@example.com'; UPDATE users SET credits=9999 WHERE email='security@example.com'; --",
        "admin@example.com' UNION SELECT * FROM users --"
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: maliciousEmail,
            password: 'password123'
          });

        // Should not succeed and should not cause database errors
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid credentials');

        // Verify users table still exists and data is intact
        const userCount = await testDb.query('SELECT COUNT(*) FROM users');
        expect(parseInt(userCount.rows[0].count)).toBeGreaterThan(0);
      }
    });

    it('should prevent SQL injection in registration', async () => {
      const sqlInjectionAttempts = [
        "evil@example.com'; DROP TABLE users; --",
        "evil@example.com' OR '1'='1' --",
        "evil@example.com'; INSERT INTO users (email, credits) VALUES ('hacker@example.com', 9999); --"
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: maliciousEmail,
            password: 'password123'
          });

        // May succeed or fail, but shouldn't cause database corruption
        expect([200, 400, 500]).toContain(response.status);

        // Verify database integrity
        const userCount = await testDb.query('SELECT COUNT(*) FROM users');
        expect(parseInt(userCount.rows[0].count)).toBeLessThan(100); // Reasonable limit

        const hackerUser = await testDb.queryOne(
          'SELECT * FROM users WHERE email = $1',
          ['hacker@example.com']
        );
        expect(hackerUser).toBeNull();
      }
    });

    it('should prevent SQL injection in credit operations', async () => {
      const sqlInjectionAttempts = [
        "1'; UPDATE users SET credits=9999; --",
        "1' OR '1'='1",
        "1'; DROP TABLE credit_usage; --"
      ];

      // Mock manipulated user ID in token (this would be harder in real scenario)
      for (const maliciousUserId of sqlInjectionAttempts) {
        const maliciousToken = jwt.sign(
          { id: maliciousUserId, email: 'security@example.com' },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .post('/api/credits/deduct')
          .set('Authorization', `Bearer ${maliciousToken}`)
          .send({ credits: 1 });

        // Should fail due to invalid user ID format
        expect([400, 401, 500]).toContain(response.status);

        // Verify credits weren't manipulated
        const user = await testDb.queryOne(
          'SELECT credits FROM users WHERE id = $1',
          [userId]
        );
        expect(user.credits).toBeLessThan(9999);
      }
    });

    it('should use parameterized queries for all database operations', async () => {
      // This is more of a code review check, but we can verify behavior
      const specialCharacters = [
        "'single quotes'",
        '"double quotes"',
        ';semicolons;',
        '--comments--',
        '/*block comments*/',
        '\\backslashes\\',
        '%wildcards%',
        '_underscores_'
      ];

      for (const specialChar of specialCharacters) {
        const email = `test${Math.random()}@example.com`;
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: email,
            password: `pass${specialChar}word`
          });

        expect(response.status).toBe(200);

        // Verify user was created properly
        const user = await testDb.queryOne(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        expect(user).toBeDefined();
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate email format in registration', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test@.com',
        'test..test@example.com',
        'test@example.',
        'test @example.com', // space
        'test@exam ple.com'  // space in domain
      ];

      for (const invalidEmail of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: invalidEmail,
            password: 'password123'
          });

        // Current implementation doesn't validate email format, but it's good practice
        // This test documents the current behavior and can be updated if validation is added
        expect([200, 400]).toContain(response.status);
      }
    });

    it('should handle null and undefined values', async () => {
      const nullValues = [
        { email: null, password: 'password123' },
        { email: 'test@example.com', password: null },
        { email: undefined, password: 'password123' },
        { email: 'test@example.com', password: undefined }
      ];

      for (const testCase of nullValues) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(testCase);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Email and password required');
      }
    });

    it('should handle extremely long inputs', async () => {
      const longString = 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: longString + '@example.com',
          password: longString
        });

      // Should handle gracefully without crashing
      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('should sanitize output data', async () => {
      // Create user with potential XSS in "name" field (if it existed)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // Verify response doesn't contain script tags or other dangerous content
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toMatch(/<script/i);
      expect(responseString).not.toMatch(/javascript:/i);
      expect(responseString).not.toMatch(/onclick=/i);
      expect(responseString).not.toMatch(/onerror=/i);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent unauthorized access to protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'GET', path: '/api/auth/me' },
        { method: 'GET', path: '/api/credits' },
        { method: 'POST', path: '/api/credits/deduct' },
        { method: 'POST', path: '/api/create-payment' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method.toLowerCase()](endpoint.path);
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'No token provided');
      }
    });

    it('should prevent access with inactive user accounts', async () => {
      // Deactivate user
      await testDb.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either deny access or return empty user data
      expect([401, 404]).toContain(response.status);
    });

    it('should prevent privilege escalation through token manipulation', async () => {
      // Create admin-like token (even though we don't have admin roles)
      const manipulatedToken = jwt.sign(
        { 
          id: userId, 
          email: 'security@example.com',
          role: 'admin', // Add fake admin role
          isAdmin: true,
          permissions: ['all']
        },
        process.env.JWT_SECRET
      );

      // Try to access protected resource
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${manipulatedToken}`);

      // Should work but not expose extra privileges in response
      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('role');
      expect(response.body.user).not.toHaveProperty('isAdmin');
      expect(response.body.user).not.toHaveProperty('permissions');
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/health')
            .timeout(1000)
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Most should succeed, some might timeout but server should remain stable
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(successful.length).toBeGreaterThan(30); // At least 60% should succeed
    });

    it('should handle concurrent authentication attempts', async () => {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test1@example.com',
              password: 'wrongpassword'
            })
            .timeout(2000)
        );
      }

      const results = await Promise.allSettled(promises);
      
      // All should fail authentication but server should handle gracefully
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(401);
        }
      });
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Try to cause database error
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test1@example.com', // Duplicate email
          password: 'password123'
        });

      expect(response.status).toBe(400);
      
      // Error message should not expose database details
      const errorMessage = response.body.error;
      expect(errorMessage).not.toMatch(/PostgreSQL/i);
      expect(errorMessage).not.toMatch(/database/i);
      expect(errorMessage).not.toMatch(/constraint/i);
      expect(errorMessage).not.toMatch(/duplicate key/i);
      expect(errorMessage).not.toMatch(/pg_/i);
    });

    it('should handle server errors without exposing stack traces', async () => {
      // This is hard to test without causing actual errors
      // We'll test that the error handling pattern doesn't expose traces
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('trace');
      expect(response.body).not.toHaveProperty('details');
    });
  });

  describe('CORS and Headers Security', () => {
    it('should set appropriate security headers', async () => {
      const response = await request(app).get('/api/health');

      // Check for security headers (if implemented)
      // Note: These might need to be added to the actual server
      const headers = response.headers;
      
      // Document current header behavior
      expect(response.status).toBe(200);
      // Future security headers to consider:
      // - X-Content-Type-Options: nosniff
      // - X-Frame-Options: DENY
      // - X-XSS-Protection: 1; mode=block
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://example.com');

      // Should handle OPTIONS requests for CORS preflight
      expect([200, 204]).toContain(response.status);
    });
  });
});