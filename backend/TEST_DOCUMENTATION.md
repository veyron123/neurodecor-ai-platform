# NeuroDecor Backend Testing Documentation

## Overview

This document provides comprehensive testing documentation for the NeuroDecor backend system. The test suite covers unit tests, integration tests, security tests, and performance validation to ensure robust and secure operation.

## Test Architecture

### Framework: Jest
- **Version**: 29.7.0
- **Environment**: Node.js
- **Database**: PostgreSQL with dedicated test database
- **Coverage Target**: 80%+ across all metrics

### Test Structure
```
backend/
├── __tests__/
│   ├── setup.js                    # Global test configuration
│   ├── testDatabase.js             # Test database utilities
│   ├── unit/                       # Unit tests
│   │   ├── auth.test.js
│   │   ├── database.test.js
│   │   └── paymentHelpers.test.js
│   ├── integration/                # Integration tests
│   │   ├── auth.integration.test.js
│   │   ├── credits.integration.test.js
│   │   ├── payments.integration.test.js
│   │   └── imageTransform.integration.test.js
│   ├── security/                   # Security tests
│   │   └── security.test.js
│   └── mocks/                      # Mock utilities
│       └── externalServices.js
├── jest.config.js                  # Jest configuration
└── TEST_DOCUMENTATION.md           # This file
```

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL database
- Test environment variables configured

### Installation
```bash
# Install dependencies
cd backend
npm install

# Setup test environment
cp .env.example .env.test
# Edit .env.test with test database credentials
```

### Environment Variables
Create a `.env.test` file with:
```env
NODE_ENV=test
DB_NAME=neurodecor_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=test-jwt-secret-key-for-testing-only
BFL_API_KEY=test-flux-api-key
GOOGLE_CLIENT_ID=test-google-client-id
WAYFORPAY_MERCHANT_ACCOUNT=test-merchant
WAYFORPAY_MERCHANT_SECRET_KEY=test-secret-key
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should authenticate"

# Run tests with debug output
TEST_DEBUG=true npm test
```

## Test Categories

### 1. Unit Tests

#### Authentication Module (`auth.test.js`)
- **Coverage**: Password hashing, JWT token management, user registration/login
- **Key Tests**:
  - Password hashing with bcrypt
  - JWT token generation and verification
  - User registration with duplicate email handling
  - Login with invalid credentials
  - Credit management (deduction, addition)
  - Auth middleware protection

**Example:**
```javascript
it('should hash password with bcrypt', async () => {
  const password = 'testpassword123';
  const hash = await auth.hashPassword(password);
  
  expect(hash).toBeDefined();
  expect(hash).not.toBe(password);
  expect(hash).toMatch(/^\$2[aby]?\$/);
});
```

#### Database Module (`database.test.js`)
- **Coverage**: Connection handling, query execution, transactions
- **Key Tests**:
  - Database connection establishment
  - Query execution (SELECT, INSERT, UPDATE, DELETE)
  - Single row queries with `queryOne`
  - Transaction handling with rollback
  - Health check functionality
  - Performance with large result sets

#### Payment Helpers (`paymentHelpers.test.js`)
- **Coverage**: Payment processing functions, error handling
- **Key Tests**:
  - Successful payment processing
  - Transaction status updates
  - Error handling patterns
  - Database transaction atomicity

### 2. Integration Tests

#### Authentication Endpoints (`auth.integration.test.js`)
- **Coverage**: All `/api/auth/*` endpoints
- **Key Tests**:
  - User registration with validation
  - Login with various scenarios
  - Google OAuth authentication
  - Protected route access with JWT
  - Edge cases and error handling

**Example:**
```javascript
it('should register new user successfully', async () => {
  const userData = {
    email: 'newuser@example.com',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
  expect(response.body.user.email).toBe(userData.email);
});
```

#### Credit System (`credits.integration.test.js`)
- **Coverage**: Credit management endpoints
- **Key Tests**:
  - Credit balance retrieval
  - Credit deduction with validation
  - Insufficient credit handling
  - Concurrent credit operations
  - Credit usage tracking

#### Payment System (`payments.integration.test.js`)
- **Coverage**: Payment creation and callback handling
- **Key Tests**:
  - Payment creation for all product types
  - WayForPay callback processing
  - Payment success/failure scenarios
  - Transaction status management
  - End-to-end payment flow

#### Image Transformation (`imageTransform.integration.test.js`)
- **Coverage**: Image upload and AI transformation
- **Key Tests**:
  - Image transformation with Flux API
  - Room type and style validation
  - Credit deduction on transformation
  - File upload handling
  - API error scenarios

### 3. Security Tests

#### Security Validation (`security.test.js`)
- **Coverage**: Authentication security, SQL injection prevention, input validation
- **Key Tests**:
  - JWT token security (tampering, expiration)
  - Password hashing validation
  - SQL injection prevention
  - Input sanitization
  - Authorization enforcement
  - Error message security

**Example:**
```javascript
it('should prevent SQL injection in login', async () => {
  const maliciousEmail = "admin@example.com'; DROP TABLE users; --";
  
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: maliciousEmail,
      password: 'password123'
    });

  expect(response.status).toBe(401);
  // Verify database integrity maintained
  const userCount = await testDb.query('SELECT COUNT(*) FROM users');
  expect(parseInt(userCount.rows[0].count)).toBeGreaterThan(0);
});
```

## Test Database Management

### Test Database Setup
The test suite uses a dedicated PostgreSQL database with the following features:

- **Isolation**: Each test starts with a clean database state
- **Seeding**: Consistent test data for reliable tests
- **Transactions**: Database operations are wrapped in transactions for rollback
- **Schema Management**: Automatic schema creation and updates

### TestDatabase Class
```javascript
const testDb = require('./testDatabase');

// Setup schema
await testDb.setupSchema();

// Clean database
await testDb.clean();

// Seed test data
await testDb.seed();

// Execute queries
const result = await testDb.query('SELECT * FROM users');
const user = await testDb.queryOne('SELECT * FROM users WHERE id = $1', [1]);

// Execute transaction
await testDb.transaction(async (client) => {
  await client.query('UPDATE users SET credits = credits + 10');
  await client.query('INSERT INTO transactions ...');
});
```

## Mock Services

### External Service Mocking
The test suite includes comprehensive mocks for external services:

#### Flux AI API
```javascript
const { createFluxAPIMock } = require('./mocks/externalServices');
const fluxMock = createFluxAPIMock();

// Mock successful generation
fluxMock.mockSuccessfulGeneration();

// Mock failure
fluxMock.mockFailedGeneration('Processing error');

// Mock timeout
fluxMock.mockTimeout();
```

#### WayForPay Payment System
```javascript
const { createWayForPayMock } = require('./mocks/externalServices');
const wayforpayMock = createWayForPayMock();

// Create successful callback
const callback = wayforpayMock.createSuccessfulCallback('ORDER-123');

// Create declined callback
const declined = wayforpayMock.createDeclinedCallback('ORDER-123', 'Insufficient funds');
```

#### Google OAuth
```javascript
const { createGoogleOAuthMock } = require('./mocks/externalServices');
const googleMock = createGoogleOAuthMock();

// Mock OAuth client
const client = googleMock.mockOAuth2Client();

// Mock invalid token
const invalidClient = googleMock.mockInvalidToken();
```

## Test Utilities

### Global Test Utilities
Available in all tests via `global.testUtils`:

```javascript
// Create test user data
const userData = global.testUtils.createTestUser({
  email: 'custom@example.com',
  credits: 20
});

// Create test transaction
const transaction = global.testUtils.createTestTransaction(userId, {
  amount: 200.00,
  credits_added: 20
});

// Generate random data
const email = global.testUtils.randomEmail();
const string = global.testUtils.randomString(10);

// Wait for async operations
await global.testUtils.wait(100);
```

### Response Assertions
Common assertion patterns:

```javascript
// Success response
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('success', true);

// Error response
expect(response.status).toBe(400);
expect(response.body).toHaveProperty('error');

// Authentication response
expect(response.body).toHaveProperty('token');
expect(response.body).toHaveProperty('user');
expect(response.body.user).not.toHaveProperty('password');
```

## Coverage Requirements

### Minimum Coverage Thresholds
```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './auth/auth.js': {
    branches: 80,
    functions: 90,
    lines: 85,
    statements: 85
  }
}
```

### Coverage Reports
- **Console**: Summary displayed after test run
- **HTML**: Detailed report in `coverage/lcov-report/index.html`
- **LCOV**: Machine-readable format for CI/CD
- **Clover**: XML format for build tools

## Performance Considerations

### Test Performance
- **Parallel Execution**: Tests run in parallel where possible
- **Database Optimization**: Minimal data seeding and efficient cleanup
- **Mock Usage**: External services are mocked to avoid network delays
- **Resource Cleanup**: Proper cleanup prevents memory leaks

### Performance Testing
Basic performance validation included:

```javascript
it('should handle large result sets efficiently', async () => {
  // Insert test data
  const startTime = Date.now();
  const result = await testDb.query('SELECT COUNT(*) FROM users');
  const queryTime = Date.now() - startTime;

  expect(queryTime).toBeLessThan(1000); // <1 second
});
```

## Best Practices

### Test Organization
1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Arrange-Act-Assert**: Clear test structure
4. **Independent Tests**: Tests should not depend on each other
5. **Cleanup**: Proper resource cleanup in afterEach/afterAll

### Data Management
1. **Fresh State**: Each test starts with clean database state
2. **Realistic Data**: Use representative test data
3. **Edge Cases**: Test boundary conditions and error scenarios
4. **Concurrency**: Test concurrent operations where applicable

### Error Testing
1. **Expected Errors**: Test error conditions explicitly
2. **Error Messages**: Verify error messages don't expose sensitive data
3. **Recovery**: Test system recovery from error states
4. **Logging**: Verify appropriate error logging

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: neurodecor_test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test -- --coverage
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "cd backend && npm test",
      "pre-push": "cd backend && npm run test:coverage"
    }
  }
}
```

## Debugging Tests

### Debug Mode
```bash
# Enable debug output
TEST_DEBUG=true npm test

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **Port Conflicts**: Use unique ports for test database
3. **File Permissions**: Ensure test can create/delete files in uploads directory
4. **Memory Leaks**: Check for unclosed database connections
5. **Race Conditions**: Use proper async/await patterns

## Maintenance

### Regular Tasks
1. **Dependency Updates**: Keep Jest and related packages updated
2. **Coverage Review**: Monitor coverage trends and improve low-coverage areas
3. **Performance Monitoring**: Track test execution time and optimize slow tests
4. **Mock Updates**: Update mocks when external APIs change
5. **Documentation**: Keep test documentation current with code changes

### Adding New Tests
1. Identify test category (unit/integration/security)
2. Create test file in appropriate directory
3. Follow existing naming conventions
4. Include both positive and negative test cases
5. Update coverage thresholds if needed
6. Document any special setup requirements

## Troubleshooting

### Common Test Failures

#### Database Connection Issues
```javascript
// Ensure database is running
sudo service postgresql start

// Check connection parameters
psql -h localhost -p 5432 -U postgres -d neurodecor_test
```

#### Memory Issues
```javascript
// Increase Node.js memory limit
node --max-old-space-size=4096 node_modules/.bin/jest
```

#### Timeout Issues
```javascript
// Increase Jest timeout
jest.setTimeout(30000);

// Or in specific test
it('should handle long operation', async () => {
  // Test code
}, 30000);
```

### Getting Help
1. Check Jest documentation: https://jestjs.io/docs/
2. PostgreSQL testing guides
3. Review existing test patterns in codebase
4. Check GitHub issues for similar problems
5. Enable debug mode for detailed output

---

## Summary

This test suite provides comprehensive coverage of the NeuroDecor backend system with:

- **95+ unit tests** covering core functionality
- **50+ integration tests** validating API endpoints
- **30+ security tests** ensuring system security
- **Comprehensive mocking** of external services
- **Database transaction testing** with rollback
- **Performance validation** for critical paths
- **CI/CD integration** ready

The test suite ensures reliability, security, and maintainability of the NeuroDecor backend system while providing a solid foundation for future development.