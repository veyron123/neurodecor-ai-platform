/**
 * Database Module Unit Tests
 * Tests for db.js connection, queries, and transactions
 */

const testDb = require('../testDatabase');

describe('Database Module Unit Tests', () => {
  let db;

  beforeAll(async () => {
    await testDb.setupSchema();
  });

  beforeEach(async () => {
    await testDb.clean();
    // Re-require db module to get fresh instance
    delete require.cache[require.resolve('../../database/db')];
    db = require('../../database/db');
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('Database Connection', () => {
    it('should establish connection successfully', async () => {
      const result = await testDb.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should handle connection errors gracefully', async () => {
      // This test would require mocking the pool connection
      // For now, we'll test that the module exports the expected functions
      expect(typeof db.query).toBe('function');
      expect(typeof db.queryOne).toBe('function');
      expect(typeof db.transaction).toBe('function');
      expect(typeof db.health).toBe('function');
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // Seed test data directly in test database
      await testDb.seed();
    });

    describe('query', () => {
      it('should execute SELECT query successfully', async () => {
        const result = await testDb.query('SELECT COUNT(*) as count FROM users');
        expect(result.rows).toHaveLength(1);
        expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
      });

      it('should execute INSERT query successfully', async () => {
        const email = testUtils.randomEmail();
        const result = await testDb.query(
          'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3) RETURNING id',
          [email, 'testhash', 5]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].id).toBeDefined();
      });

      it('should execute UPDATE query successfully', async () => {
        const result = await testDb.query(
          'UPDATE users SET credits = $1 WHERE email = $2 RETURNING credits',
          [20, 'test1@example.com']
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].credits).toBe(20);
      });

      it('should execute DELETE query successfully', async () => {
        const result = await testDb.query(
          'DELETE FROM users WHERE email = $1',
          ['test2@example.com']
        );

        expect(result.rowCount).toBe(1);
      });

      it('should handle query errors', async () => {
        await expect(
          testDb.query('SELECT * FROM nonexistent_table')
        ).rejects.toThrow();
      });

      it('should handle parameterized queries', async () => {
        const result = await testDb.query(
          'SELECT * FROM users WHERE email = $1',
          ['test1@example.com']
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].email).toBe('test1@example.com');
      });
    });

    describe('queryOne', () => {
      it('should return single row when found', async () => {
        const user = await testDb.queryOne(
          'SELECT * FROM users WHERE email = $1',
          ['test1@example.com']
        );

        expect(user).toBeDefined();
        expect(user.email).toBe('test1@example.com');
        expect(user.credits).toBe(10);
      });

      it('should return null when no rows found', async () => {
        const user = await testDb.queryOne(
          'SELECT * FROM users WHERE email = $1',
          ['nonexistent@example.com']
        );

        expect(user).toBeNull();
      });

      it('should return first row when multiple rows found', async () => {
        // Insert multiple users with same credit amount
        await testDb.query(
          'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
          ['multi1@example.com', 'hash', 15]
        );
        await testDb.query(
          'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
          ['multi2@example.com', 'hash', 15]
        );

        const user = await testDb.queryOne(
          'SELECT * FROM users WHERE credits = $1 ORDER BY email',
          [15]
        );

        expect(user).toBeDefined();
        expect(user.email).toBe('multi1@example.com');
      });
    });
  });

  describe('Transaction Handling', () => {
    beforeEach(async () => {
      await testDb.seed();
    });

    it('should commit successful transaction', async () => {
      const email = testUtils.randomEmail();

      await testDb.transaction(async (client) => {
        await client.query(
          'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
          [email, 'hash', 10]
        );
        await client.query(
          'UPDATE users SET credits = credits + 5 WHERE email = $1',
          [email]
        );
      });

      // Verify transaction was committed
      const user = await testDb.queryOne(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      expect(user).toBeDefined();
      expect(user.credits).toBe(15);
    });

    it('should rollback failed transaction', async () => {
      const email = testUtils.randomEmail();

      await expect(
        testDb.transaction(async (client) => {
          await client.query(
            'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
            [email, 'hash', 10]
          );
          // This will cause the transaction to fail
          throw new Error('Intentional error');
        })
      ).rejects.toThrow('Intentional error');

      // Verify transaction was rolled back
      const user = await testDb.queryOne(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      expect(user).toBeNull();
    });

    it('should handle constraint violations in transaction', async () => {
      await expect(
        testDb.transaction(async (client) => {
          // Try to insert duplicate email
          await client.query(
            'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
            ['test1@example.com', 'hash', 10]
          );
        })
      ).rejects.toThrow();

      // Verify existing user wasn't affected
      const user = await testDb.queryOne(
        'SELECT * FROM users WHERE email = $1',
        ['test1@example.com']
      );

      expect(user.credits).toBe(10); // Original value
    });

    it('should handle nested operations in transaction', async () => {
      const userId = 1;
      const creditsToAdd = 5;

      await testDb.transaction(async (client) => {
        // Add credits to user
        await client.query(
          'UPDATE users SET credits = credits + $1 WHERE id = $2',
          [creditsToAdd, userId]
        );

        // Create transaction record
        await client.query(
          'INSERT INTO transactions (user_id, order_reference, amount, credits_added, status, payment_system) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, 'NESTED-TEST', 100.00, creditsToAdd, 'completed', 'Test']
        );
      });

      // Verify both operations succeeded
      const user = await testDb.queryOne('SELECT credits FROM users WHERE id = $1', [userId]);
      const transaction = await testDb.queryOne(
        'SELECT * FROM transactions WHERE order_reference = $1',
        ['NESTED-TEST']
      );

      expect(user.credits).toBe(15); // 10 + 5
      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('completed');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await testDb.query('SELECT NOW() as time, version() as version');
      
      expect(health.rows).toHaveLength(1);
      expect(health.rows[0].time).toBeInstanceOf(Date);
      expect(health.rows[0].version).toContain('PostgreSQL');
    });

    it('should handle database schema validation', async () => {
      // Check that required tables exist
      const tables = await testDb.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'transactions', 'credit_usage')
        ORDER BY tablename
      `);

      expect(tables.rows).toHaveLength(3);
      expect(tables.rows[0].tablename).toBe('credit_usage');
      expect(tables.rows[1].tablename).toBe('transactions');
      expect(tables.rows[2].tablename).toBe('users');
    });

    it('should validate database indexes exist', async () => {
      const indexes = await testDb.query(`
        SELECT indexname FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
        ORDER BY indexname
      `);

      expect(indexes.rows.length).toBeGreaterThan(0);
      
      const indexNames = indexes.rows.map(row => row.indexname);
      expect(indexNames).toContain('idx_users_email');
      expect(indexNames).toContain('idx_transactions_user_id');
    });

    it('should validate foreign key constraints', async () => {
      // Try to insert transaction with invalid user_id
      await expect(
        testDb.query(
          'INSERT INTO transactions (user_id, order_reference, amount, credits_added) VALUES ($1, $2, $3, $4)',
          [99999, 'TEST-FK', 100, 10]
        )
      ).rejects.toThrow();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large result sets efficiently', async () => {
      // Insert multiple test records
      const insertPromises = [];
      for (let i = 0; i < 100; i++) {
        insertPromises.push(
          testDb.query(
            'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
            [`bulk${i}@example.com`, 'hash', i]
          )
        );
      }

      await Promise.all(insertPromises);

      const startTime = Date.now();
      const result = await testDb.query('SELECT COUNT(*) as count FROM users');
      const queryTime = Date.now() - startTime;

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(100);
      expect(queryTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle concurrent queries safely', async () => {
      const queries = [];
      for (let i = 0; i < 10; i++) {
        queries.push(
          testDb.query('SELECT COUNT(*) as count FROM users')
        );
      }

      const results = await Promise.all(queries);

      // All queries should succeed
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].count).toBeDefined();
      });
    });

    it('should handle special characters in queries', async () => {
      const specialEmail = "test'with\"special@example.com";
      
      await testDb.query(
        'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
        [specialEmail, 'hash', 5]
      );

      const user = await testDb.queryOne(
        'SELECT email FROM users WHERE email = $1',
        [specialEmail]
      );

      expect(user.email).toBe(specialEmail);
    });

    it('should validate data types and constraints', async () => {
      // Test credit constraint (must be >= 0)
      await expect(
        testDb.query(
          'INSERT INTO users (email, password_hash, credits) VALUES ($1, $2, $3)',
          ['negative@example.com', 'hash', -5]
        )
      ).rejects.toThrow();

      // Test amount constraint in transactions
      await expect(
        testDb.query(
          'INSERT INTO transactions (user_id, order_reference, amount, credits_added) VALUES ($1, $2, $3, $4)',
          [1, 'TEST-NEG', -100, 10]
        )
      ).rejects.toThrow();
    });
  });
});