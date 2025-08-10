const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'neurodecor-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const auth = {
    // Hash password
    hashPassword: async (password) => {
        return await bcrypt.hash(password, 10);
    },

    // Compare password
    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    },

    // Generate JWT token
    generateToken: (user) => {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    },

    // Verify JWT token
    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    },

    // Register new user
    register: async (email, password) => {
        try {
            // Check if user exists
            const existingUser = await db.queryOne(
                'SELECT id FROM users WHERE email = $1', 
                [email]
            );

            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const passwordHash = await auth.hashPassword(password);

            // Create user
            const newUser = await db.queryOne(
                `INSERT INTO users (email, password_hash, credits) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, email, credits, created_at`,
                [email, passwordHash, 0]
            );

            // Generate token
            const token = auth.generateToken(newUser);

            return {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    credits: newUser.credits,
                    createdAt: newUser.created_at
                },
                token
            };
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            // Find user
            const user = await db.queryOne(
                'SELECT id, email, password_hash, credits, is_active FROM users WHERE email = $1',
                [email]
            );

            if (!user) {
                throw new Error('Invalid credentials');
            }

            if (!user.is_active) {
                throw new Error('Account is disabled');
            }

            // Check password
            const validPassword = await auth.comparePassword(password, user.password_hash);
            if (!validPassword) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            await db.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            // Generate token
            const token = auth.generateToken(user);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    credits: user.credits
                },
                token
            };
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    },

    // Get user by ID
    getUserById: async (userId) => {
        try {
            const user = await db.queryOne(
                'SELECT id, email, credits, created_at, last_login FROM users WHERE id = $1 AND is_active = true',
                [userId]
            );

            return user;
        } catch (error) {
            console.error('❌ Get user error:', error);
            throw error;
        }
    },

    // Update user credits
    updateCredits: async (userId, credits) => {
        try {
            const result = await db.queryOne(
                'UPDATE users SET credits = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING credits',
                [credits, userId]
            );

            return result?.credits;
        } catch (error) {
            console.error('❌ Update credits error:', error);
            throw error;
        }
    },

    // Add credits (for payments)
    addCredits: async (userId, creditsToAdd) => {
        try {
            const result = await db.queryOne(
                'UPDATE users SET credits = credits + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING credits',
                [creditsToAdd, userId]
            );

            return result?.credits;
        } catch (error) {
            console.error('❌ Add credits error:', error);
            throw error;
        }
    },

    // Deduct credits (for generations)
    deductCredits: async (userId, creditsToDeduct = 1) => {
        try {
            const result = await db.queryOne(
                `UPDATE users 
                 SET credits = GREATEST(credits - $1, 0), updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2 AND credits >= $1
                 RETURNING credits`,
                [creditsToDeduct, userId]
            );

            if (!result) {
                throw new Error('Insufficient credits');
            }

            // Log credit usage
            await db.query(
                `INSERT INTO credit_usage (user_id, credits_used, operation_type, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [userId, creditsToDeduct, 'image_generation', JSON.stringify({ timestamp: new Date() })]
            );

            return result.credits;
        } catch (error) {
            console.error('❌ Deduct credits error:', error);
            throw error;
        }
    },

    // Middleware for protecting routes
    requireAuth: (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.substring(7); // Remove 'Bearer '
            const decoded = auth.verifyToken(token);
            
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
};

module.exports = auth;