/**
 * Test Database Setup and Utilities
 * Handles test database creation, seeding, and cleanup
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class TestDatabase {
  constructor() {
    this.pool = null;
    this.isSetup = false;
  }

  /**
   * Initialize test database connection
   */
  async connect() {
    if (this.pool) return this.pool;

    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'neurodecor_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 5, // Fewer connections for testing
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 1000,
    });

    // Test connection
    try {
      await this.pool.query('SELECT NOW()');
      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test database connection failed:', error.message);
      throw error;
    }

    return this.pool;
  }

  /**
   * Setup database schema
   */
  async setupSchema() {
    if (this.isSetup) return;

    const pool = await this.connect();
    
    try {
      // Read and execute schema
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await pool.query(schema);
      console.log('✅ Test database schema created');
      
      this.isSetup = true;
    } catch (error) {
      console.error('❌ Failed to setup test database schema:', error);
      throw error;
    }
  }

  /**
   * Clean all tables for fresh test state
   */
  async clean() {
    const pool = await this.connect();
    
    try {
      // Delete in order to respect foreign key constraints
      await pool.query('DELETE FROM credit_usage');
      await pool.query('DELETE FROM transactions');
      await pool.query('DELETE FROM users');
      
      // Reset sequences
      await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE transactions_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE credit_usage_id_seq RESTART WITH 1');
      
      console.log('🧹 Test database cleaned');
    } catch (error) {
      console.error('❌ Failed to clean test database:', error);
      throw error;
    }
  }

  /**
   * Seed test data
   */
  async seed() {
    const pool = await this.connect();
    
    try {
      // Create test users
      const testUsers = [
        {
          email: 'test1@example.com',
          password_hash: '$2b$10$testhashedpassword1',
          credits: 10
        },
        {
          email: 'test2@example.com',
          password_hash: '$2b$10$testhashedpassword2',
          credits: 0
        },
        {
          email: 'inactive@example.com',
          password_hash: '$2b$10$testhashedpassword3',
          credits: 5,
          is_active: false
        }
      ];

      for (const user of testUsers) {
        await pool.query(`
          INSERT INTO users (email, password_hash, credits, is_active)
          VALUES ($1, $2, $3, $4)
        `, [user.email, user.password_hash, user.credits, user.is_active ?? true]);
      }

      // Create test transactions
      const testTransactions = [
        {
          user_id: 1,
          order_reference: 'TEST-COMPLETED-001',
          amount: 100.00,
          credits_added: 10,
          status: 'completed',
          payment_system: 'WayForPay',
          product_id: 'prod_basic_10_credits'
        },
        {
          user_id: 1,
          order_reference: 'TEST-PENDING-001',
          amount: 200.00,
          credits_added: 20,
          status: 'pending',
          payment_system: 'WayForPay',
          product_id: 'prod_standard_20_credits'
        }
      ];

      for (const transaction of testTransactions) {
        await pool.query(`
          INSERT INTO transactions (user_id, order_reference, amount, credits_added, status, payment_system, product_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          transaction.user_id,
          transaction.order_reference, 
          transaction.amount,
          transaction.credits_added,
          transaction.status,
          transaction.payment_system,
          transaction.product_id
        ]);
      }

      console.log('🌱 Test database seeded');
    } catch (error) {
      console.error('❌ Failed to seed test database:', error);
      throw error;
    }
  }

  /**
   * Execute query on test database
   */
  async query(text, params) {
    const pool = await this.connect();
    return pool.query(text, params);
  }

  /**
   * Get single row from test database
   */
  async queryOne(text, params) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute transaction on test database
   */
  async transaction(callback) {
    const pool = await this.connect();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isSetup = false;
      console.log('🔐 Test database connection closed');
    }
  }
}

// Export singleton instance
module.exports = new TestDatabase();