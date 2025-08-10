const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.WAYFORPAY_MERCHANT_SECRET_KEY = 'test-wayforpay-secret';

// Mock console methods in non-debug mode
if (!process.env.TEST_DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };
}

// Global test utilities
global.createMockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  file: null,
  ...overrides
});

global.createMockRes = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    set: jest.fn(() => res)
  };
  return res;
};

global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test database utilities
global.cleanupDatabase = async (db) => {
  if (db && typeof db.query === 'function') {
    await db.query('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE %test%)')
      .catch(() => {}); // Ignore errors
    await db.query('DELETE FROM users WHERE email LIKE %test%')
      .catch(() => {}); // Ignore errors  
  }
};

// Setup test timeout
jest.setTimeout(30000);

// Global setup
beforeAll(() => {
  // Suppress console logs during tests unless debug mode
  if (!process.env.TEST_DEBUG) {
    console.log = jest.fn();
    console.warn = jest.fn(); 
    console.error = jest.fn();
    console.info = jest.fn();
  }
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

// Error logging utility for tests
global.logTestError = (testName, error) => {
  if (process.env.TEST_DEBUG) {
    console.error(`❌ Test failed: ${testName}`, error);
  }
};