# NeuroDecor Backend Test Suite

Comprehensive test coverage for the NeuroDecor backend API following KISS (Keep It Simple, Stupid) principles.

## Overview

This test suite provides comprehensive coverage for the refactored NeuroDecor backend, focusing on:
- **Payment System**: WayForPay integration and credit processing
- **Authentication**: Google OAuth and JWT token management  
- **Credit System**: User credits, deduction, and transaction handling
- **Security**: SQL injection prevention, input validation, and authorization
- **External APIs**: Flux AI image generation integration

## Test Structure

```
__tests__/
├── setup.js                    # Global test configuration
├── mocks/
│   └── externalServices.js     # Mock implementations for external APIs
├── unit/
│   └── paymentHelpers.test.js  # Unit tests for payment helper functions
├── integration/
│   ├── auth.integration.test.js      # Authentication endpoint tests
│   ├── credits.integration.test.js   # Credits system endpoint tests
│   └── payments.integration.test.js  # Payment processing endpoint tests
└── security/
    └── security.test.js        # Security vulnerability tests
```

## Key Features

### 🎯 KISS-Focused Testing
- Simple, readable test cases that match the simplified codebase
- Clear test descriptions and expectations
- Minimal mocking complexity

### 🔧 Comprehensive Mocking
- **WayForPay API**: Payment callback simulation
- **Flux AI API**: Image generation and polling
- **Google OAuth**: Token verification
- **Database**: PostgreSQL operations
- **Crypto**: Signature generation

### 🛡️ Security Testing
- SQL injection prevention
- JWT token validation
- Input sanitization
- Authorization checks
- Rate limiting behavior

### ⚡ Performance Testing
- Concurrent request handling
- Database transaction integrity
- Credit deduction accuracy under load

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'server-postgres.js',
    'auth/**/*.js',
    'database/**/*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

### Environment Setup
- Test environment isolation
- Mock external service dependencies
- Consistent test data seeding
- Automatic cleanup between tests

## Running Tests

### Prerequisites
```bash
npm install --save-dev jest supertest
```

### Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- payments.integration.test.js

# Run in watch mode
npm test -- --watch

# Run with debug output
TEST_DEBUG=1 npm test
```

## Test Categories

### Unit Tests (`__tests__/unit/`)
Test individual helper functions extracted during KISS refactoring:

- `processSuccessfulPayment()`: Credit addition after successful payments
- `updateTransactionStatus()`: Transaction status updates
- `handleError()`: Unified error response handling

**Example:**
```javascript
describe('processSuccessfulPayment', () => {
  it('should process successful payment with database transaction', async () => {
    const callbackData = mockWayForPayCallback();
    await processSuccessfulPayment(mockTransaction, callbackData);
    
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests (`__tests__/integration/`)

#### Payment Integration Tests
- WayForPay callback processing
- Credit package validation
- Transaction creation and completion
- Concurrent payment handling
- Edge cases and error scenarios

#### Authentication Integration Tests  
- Google OAuth flow
- JWT token validation
- Protected endpoint access
- Session management
- User data security

#### Credits Integration Tests
- Credit deduction during AI generation
- Credit addition after payments
- Balance validation
- Concurrent operations
- Insufficient credits handling

### Security Tests (`__tests__/security/`)
Comprehensive security validation:

- **SQL Injection**: Parameterized query verification
- **Authentication**: JWT security, token tampering
- **Authorization**: Endpoint protection, privilege escalation
- **Input Validation**: XSS prevention, special characters
- **Error Handling**: Information disclosure prevention
- **Rate Limiting**: DoS protection

## Mock Services

### External Service Mocking
The test suite includes comprehensive mocks for all external dependencies:

```javascript
// WayForPay Payment Callback Mock
const mockWayForPayCallback = (status = 'Approved') => ({
  merchantAccount: 'test_merchant',
  orderReference: 'TEST-ORDER-123',
  transactionStatus: status,
  amount: 1,
  currency: 'UAH'
});

// Flux AI API Mock
const mockFluxAPI = {
  success: () => ({ data: { polling_url: 'https://api.bfl.ai/v1/get_result?id=test-123' } }),
  pollingSuccess: () => ({ data: { status: 'Ready', result: { sample: 'https://test-image-url.com/result.jpg' } } })
};
```

## Coverage Targets

The test suite aims for comprehensive coverage:

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| **Global** | 80% | 75% | 80% | 80% |
| **Auth** | 85% | 80% | 90% | 85% |
| **Database** | 80% | 75% | 85% | 80% |

## Key Test Scenarios

### Payment Processing
- ✅ Successful payment callback processing
- ✅ Failed payment handling
- ✅ Concurrent callback processing
- ✅ Invalid order reference handling
- ✅ Signature verification

### Credit System
- ✅ Credit deduction validation
- ✅ Insufficient credits prevention
- ✅ Credit addition after payment
- ✅ Concurrent operations safety
- ✅ Credit history tracking

### Authentication
- ✅ Google OAuth integration
- ✅ JWT token validation
- ✅ Protected endpoint access
- ✅ Session management
- ✅ Token expiration handling

### Security
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Input validation
- ✅ Authorization checks
- ✅ Error information disclosure

## Best Practices

### Test Organization
- **Arrange-Act-Assert** pattern
- **Descriptive test names** explaining the scenario
- **Single responsibility** per test case
- **Consistent setup/teardown**

### Mocking Strategy
- **Mock external dependencies** only
- **Preserve business logic** in tests
- **Use realistic test data**
- **Avoid over-mocking**

### Error Testing
- **Test both success and failure paths**
- **Validate error messages** don't expose sensitive data
- **Ensure graceful degradation**
- **Test edge cases and boundary conditions**

## Debugging Tests

### Debug Mode
```bash
TEST_DEBUG=1 npm test
```
This enables console output and detailed error logging.

### Common Issues
1. **Database connection**: Ensure PostgreSQL is running and accessible
2. **Environment variables**: Check `.env.test` configuration
3. **Port conflicts**: Ensure test server port is available
4. **Mock timing**: Allow for async operations to complete

### Test Data Management
- Tests use isolated test database
- Automatic cleanup between test runs
- Consistent seed data for predictable results
- Transaction rollback for database tests

## Contributing

When adding new tests:

1. **Follow KISS principles** - keep tests simple and focused
2. **Add appropriate mocks** for external dependencies
3. **Test both happy and error paths**
4. **Update coverage thresholds** if needed
5. **Document complex test scenarios**

### Test Naming Convention
```javascript
describe('Feature/Component Name', () => {
  describe('Specific functionality', () => {
    it('should do something specific when condition is met', async () => {
      // Test implementation
    });
  });
});
```

## Maintenance

### Regular Tasks
- **Monitor coverage reports** for gaps
- **Update mocks** when external APIs change  
- **Review security tests** for new vulnerabilities
- **Optimize slow tests** for faster CI/CD

### Test Performance
- Current test suite runs in ~30 seconds
- Parallel execution with Jest workers
- Efficient mocking reduces external calls
- Database operations are optimized

---

This comprehensive test suite ensures the KISS-refactored NeuroDecor backend maintains high quality, security, and reliability while remaining simple and maintainable.