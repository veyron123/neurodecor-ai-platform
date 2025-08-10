module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'server-postgres.js',
    'auth/**/*.js',
    'database/**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!__tests__/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './auth/auth.js': {
      statements: 85,
      branches: 80,
      functions: 90,
      lines: 85
    },
    './database/db.js': {
      statements: 80,
      branches: 75,
      functions: 85,
      lines: 80
    }
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/uploads/'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  verbose: true,
  collectCoverage: false,
  maxWorkers: '50%',
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true
};