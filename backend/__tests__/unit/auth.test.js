/**
 * Authentication Module Unit Tests
 * Tests for auth.js functions and JWT handling
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const testDb = require('../testDatabase');

// Mock database module
jest.mock('../../database/db');
const mockDb = require('../../database/db');

describe('Authentication Module Unit Tests', () => {
  let auth;

  beforeAll(async () => {
    await testDb.setupSchema();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require auth module to get fresh instance
    delete require.cache[require.resolve('../../auth/auth')];
    auth = require('../../auth/auth');
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('Password Hashing', () => {
    describe('hashPassword', () => {
      it('should hash password with bcrypt', async () => {
        const password = 'testpassword123';
        const hash = await auth.hashPassword(password);

        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(50);
        expect(hash).toMatch(/^\$2[aby]?\$/);
      });

      it('should generate different hashes for same password', async () => {
        const password = 'testpassword123';
        const hash1 = await auth.hashPassword(password);
        const hash2 = await auth.hashPassword(password);

        expect(hash1).not.toBe(hash2);
      });

      it('should handle empty password', async () => {
        const hash = await auth.hashPassword('');
        expect(hash).toBeDefined();
      });

      it('should handle special characters in password', async () => {
        const password = 'test!@#$%^&*()_+{}|:<>?';
        const hash = await auth.hashPassword(password);
        expect(hash).toBeDefined();
      });
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const password = 'testpassword123';
        const hash = await auth.hashPassword(password);
        const isValid = await auth.comparePassword(password, hash);

        expect(isValid).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'testpassword123';
        const wrongPassword = 'wrongpassword';
        const hash = await auth.hashPassword(password);
        const isValid = await auth.comparePassword(wrongPassword, hash);

        expect(isValid).toBe(false);
      });

      it('should handle empty password comparison', async () => {
        const hash = await auth.hashPassword('realpassword');
        const isValid = await auth.comparePassword('', hash);

        expect(isValid).toBe(false);
      });

      it('should handle malformed hash', async () => {
        const isValid = await auth.comparePassword('password', 'invalid-hash');
        expect(isValid).toBe(false);
      });
    });
  });

  describe('JWT Token Management', () => {
    const testUser = {
      id: 1,
      email: 'test@example.com'
    };

    describe('generateToken', () => {
      it('should generate valid JWT token', () => {
        const token = auth.generateToken(testUser);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
      });

      it('should include user data in token payload', () => {
        const token = auth.generateToken(testUser);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.id).toBe(testUser.id);
        expect(decoded.email).toBe(testUser.email);
        expect(decoded.exp).toBeDefined();
        expect(decoded.iat).toBeDefined();
      });

      it('should handle user without email', () => {
        const userNoEmail = { id: 1 };
        const token = auth.generateToken(userNoEmail);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.id).toBe(1);
        expect(decoded.email).toBeUndefined();
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', () => {
        const token = auth.generateToken(testUser);
        const decoded = auth.verifyToken(token);

        expect(decoded.id).toBe(testUser.id);
        expect(decoded.email).toBe(testUser.email);
      });

      it('should throw error for invalid token', () => {
        expect(() => {
          auth.verifyToken('invalid.token.here');
        }).toThrow('Invalid token');
      });

      it('should throw error for expired token', () => {
        // Create token with past expiration
        const expiredToken = jwt.sign(
          testUser,
          process.env.JWT_SECRET,
          { expiresIn: '-1s' }
        );

        expect(() => {
          auth.verifyToken(expiredToken);
        }).toThrow('Invalid token');
      });

      it('should throw error for tampered token', () => {
        const token = auth.generateToken(testUser);
        const tamperedToken = token.slice(0, -1) + 'x';

        expect(() => {
          auth.verifyToken(tamperedToken);
        }).toThrow('Invalid token');
      });
    });
  });

  describe('User Registration', () => {
    beforeEach(() => {
      mockDb.queryOne.mockClear();
      mockDb.query.mockClear();
    });

    it('should register new user successfully', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      // Mock database responses
      mockDb.queryOne.mockResolvedValueOnce(null); // User doesn't exist
      mockDb.queryOne.mockResolvedValueOnce({
        id: 1,
        email: email,
        credits: 0,
        created_at: new Date()
      });

      const result = await auth.register(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(email);
      expect(result.user.id).toBe(1);
      expect(typeof result.token).toBe('string');

      // Verify database calls
      expect(mockDb.queryOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error if user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      // Mock existing user
      mockDb.queryOne.mockResolvedValueOnce({ id: 1, email });

      await expect(auth.register(email, password))
        .rejects.toThrow('User already exists');

      expect(mockDb.queryOne).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors during registration', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      // Mock database error
      mockDb.queryOne.mockRejectedValueOnce(new Error('Database error'));

      await expect(auth.register(email, password))
        .rejects.toThrow('Database error');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      mockDb.queryOne.mockClear();
      mockDb.query.mockClear();
    });

    it('should login user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mock user exists with correct password
      mockDb.queryOne.mockResolvedValueOnce({
        id: 1,
        email: email,
        password_hash: hashedPassword,
        credits: 10,
        is_active: true
      });

      const result = await auth.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(email);
      expect(result.user.credits).toBe(10);

      // Verify last login update was called
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [1]
      );
    });

    it('should throw error for non-existent user', async () => {
      mockDb.queryOne.mockResolvedValueOnce(null);

      await expect(auth.login('nonexistent@example.com', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const email = 'inactive@example.com';
      mockDb.queryOne.mockResolvedValueOnce({
        id: 1,
        email: email,
        password_hash: 'hash',
        is_active: false
      });

      await expect(auth.login(email, 'password'))
        .rejects.toThrow('Account is disabled');
    });

    it('should throw error for invalid password', async () => {
      const email = 'test@example.com';
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      mockDb.queryOne.mockResolvedValueOnce({
        id: 1,
        email: email,
        password_hash: hashedPassword,
        is_active: true
      });

      await expect(auth.login(email, 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Credit Management', () => {
    beforeEach(() => {
      mockDb.queryOne.mockClear();
      mockDb.query.mockClear();
    });

    describe('getUserById', () => {
      it('should return user data for valid ID', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          credits: 10,
          created_at: new Date(),
          last_login: new Date()
        };

        mockDb.queryOne.mockResolvedValueOnce(mockUser);

        const result = await auth.getUserById(1);

        expect(result).toEqual(mockUser);
        expect(mockDb.queryOne).toHaveBeenCalledWith(
          'SELECT id, email, credits, created_at, last_login FROM users WHERE id = $1 AND is_active = true',
          [1]
        );
      });

      it('should return null for non-existent user', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const result = await auth.getUserById(999);

        expect(result).toBeNull();
      });
    });

    describe('deductCredits', () => {
      it('should deduct credits successfully', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ credits: 9 });
        mockDb.query.mockResolvedValueOnce();

        const result = await auth.deductCredits(1, 1);

        expect(result).toBe(9);
        expect(mockDb.queryOne).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE users'),
          [1, 1]
        );
        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO credit_usage'),
          expect.arrayContaining([1, 1, 'image_generation'])
        );
      });

      it('should throw error for insufficient credits', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        await expect(auth.deductCredits(1, 5))
          .rejects.toThrow('Insufficient credits');
      });

      it('should handle database errors', async () => {
        mockDb.queryOne.mockRejectedValueOnce(new Error('Database error'));

        await expect(auth.deductCredits(1, 1))
          .rejects.toThrow('Database error');
      });
    });

    describe('addCredits', () => {
      it('should add credits successfully', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ credits: 15 });

        const result = await auth.addCredits(1, 5);

        expect(result).toBe(15);
        expect(mockDb.queryOne).toHaveBeenCalledWith(
          'UPDATE users SET credits = credits + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING credits',
          [5, 1]
        );
      });
    });
  });

  describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('should authenticate valid token', () => {
      const testUser = { id: 1, email: 'test@example.com' };
      const token = auth.generateToken(testUser);
      req.headers.authorization = `Bearer ${token}`;

      auth.requireAuth(req, res, next);

      expect(req.user).toEqual(expect.objectContaining(testUser));
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      auth.requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      req.headers.authorization = 'Invalid token format';

      auth.requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      auth.requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});