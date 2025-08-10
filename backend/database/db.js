const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    // For local development
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'neurodecor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    
    // For production (Render PostgreSQL)
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});

// Database helper functions
const db = {
    // Execute query
    query: async (text, params) => {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('📊 Query executed:', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    },

    // Get single row
    queryOne: async (text, params) => {
        const result = await db.query(text, params);
        return result.rows[0] || null;
    },

    // Transaction wrapper
    transaction: async (callback) => {
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
    },

    // Initialize database (create tables)
    init: async () => {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            await db.query(schema);
            console.log('✅ Database schema initialized');
        } catch (error) {
            console.error('❌ Failed to initialize database:', error);
            throw error;
        }
    },

    // Health check
    health: async () => {
        try {
            const result = await db.query('SELECT NOW() as time, version() as version');
            return {
                status: 'healthy',
                time: result.rows[0].time,
                version: result.rows[0].version.split(' ')[0]
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
};

module.exports = db;