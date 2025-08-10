require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

// PostgreSQL imports
const db = require('./database/db');
const auth = require('./auth/auth');

// Products configuration (same as before)
const PRODUCTS = {
    'prod_basic_10_credits': { name: 'Базовий', price: 1, credits: 10 },
    'prod_standard_20_credits': { name: 'Стандарт', price: 1400, credits: 20 },
    'prod_prof_60_credits': { name: 'Професійний', price: 3200, credits: 60 }
};

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3006', 'http://localhost:3007', 'https://neurodecor-frontend.onrender.com'],
    credentials: true
}));

// Initialize database on startup
(async () => {
    try {
        await db.init();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
})();

// ========== AUTH ENDPOINTS ==========

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const result = await auth.register(email, password);
        console.log('✅ User registered:', email);
        
        res.json({
            success: true,
            user: result.user,
            token: result.token
        });
    } catch (error) {
        console.error('❌ Registration failed:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await auth.login(email, password);
        console.log('✅ User logged in:', email);
        
        res.json({
            success: true,
            user: result.user,
            token: result.token
        });
    } catch (error) {
        console.error('❌ Login failed:', error);
        res.status(401).json({ error: error.message });
    }
});

// Get current user endpoint (protected)
app.get('/api/auth/me', auth.requireAuth, async (req, res) => {
    try {
        const user = await auth.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                credits: user.credits,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    } catch (error) {
        console.error('❌ Get user failed:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// ========== CREDIT ENDPOINTS ==========

// Get user credits (protected)
app.get('/api/credits', auth.requireAuth, async (req, res) => {
    try {
        const user = await auth.getUserById(req.user.id);
        res.json({
            success: true,
            credits: user?.credits || 0,
            userId: req.user.id
        });
    } catch (error) {
        console.error('❌ Get credits failed:', error);
        res.status(500).json({ error: 'Failed to get credits' });
    }
});

// Deduct credit (protected)
app.post('/api/credits/deduct', auth.requireAuth, async (req, res) => {
    try {
        const { credits = 1 } = req.body;
        const newCredits = await auth.deductCredits(req.user.id, credits);
        
        console.log(`✅ Credits deducted: ${credits} from user ${req.user.id}, remaining: ${newCredits}`);
        
        res.json({
            success: true,
            creditsRemaining: newCredits
        });
    } catch (error) {
        console.error('❌ Deduct credits failed:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========== PAYMENT ENDPOINTS ==========

// Create payment endpoint (protected)
app.post('/api/create-payment', auth.requireAuth, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    
    if (!productId || !PRODUCTS[productId]) {
        return res.status(400).json({ error: 'Invalid product' });
    }

    const product = PRODUCTS[productId];
    const { WAYFORPAY_MERCHANT_ACCOUNT, WAYFORPAY_MERCHANT_SECRET_KEY, NGROK_URL } = process.env;
    
    if (!WAYFORPAY_MERCHANT_ACCOUNT || !WAYFORPAY_MERCHANT_SECRET_KEY) {
        return res.status(500).json({ error: 'Payment system not configured' });
    }

    const orderReference = `WFP-${productId}-${userId}-${Date.now()}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const serviceUrl = NGROK_URL ? `${NGROK_URL}/api/payment-callback` : `${req.protocol}://${req.get('host')}/api/payment-callback`;

    try {
        // Create pending transaction
        await db.query(
            `INSERT INTO transactions (user_id, order_reference, amount, credits_added, status, payment_system, product_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, orderReference, product.price, product.credits, 'pending', 'WayForPay', productId]
        );

        console.log('✅ Pending transaction created:', orderReference);

        const signatureData = [WAYFORPAY_MERCHANT_ACCOUNT, req.hostname, orderReference, orderDate, product.price, 'UAH', product.name, 1, product.price].join(';');
        const merchantSignature = crypto.createHmac('md5', WAYFORPAY_MERCHANT_SECRET_KEY).update(signatureData).digest('hex');

        res.json({
            merchantAccount: WAYFORPAY_MERCHANT_ACCOUNT,
            merchantAuthType: 'Simple',
            merchantDomainName: req.hostname,
            orderReference, orderDate,
            amount: product.price,
            currency: 'UAH',
            productName: [product.name],
            productCount: [1],
            productPrice: [product.price],
            serviceUrl, merchantSignature
        });
    } catch (error) {
        console.error('❌ Payment creation failed:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Payment callback endpoint
app.post('/api/payment-callback', async (req, res) => {
    console.log('💳 PAYMENT CALLBACK RECEIVED:', Date.now());
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const bodyKey = Object.keys(req.body)[0];
    if (!bodyKey) {
        console.error('❌ No body key found in callback');
        return res.status(400).json({ error: 'Invalid callback format' });
    }

    try {
        const data = JSON.parse(bodyKey);
        console.log('📊 Parsed callback data:', JSON.stringify(data, null, 2));
        
        const { orderReference, transactionStatus, amount } = data;
        
        if (!orderReference) {
            console.error('❌ No order reference in callback');
            return res.status(400).json({ error: 'Invalid payment data' });
        }

        // Find transaction in database
        const transaction = await db.queryOne(
            'SELECT * FROM transactions WHERE order_reference = $1',
            [orderReference]
        );

        if (!transaction) {
            console.error('❌ Transaction not found:', orderReference);
            return res.status(400).json({ error: 'Transaction not found' });
        }

        console.log('📋 Found transaction:', transaction);

        if (transactionStatus === 'Approved') {
            console.log('✅ Payment approved, processing...');
            
            try {
                // Use database transaction for atomicity
                await db.transaction(async (client) => {
                    // Update transaction status
                    await client.query(
                        `UPDATE transactions 
                         SET status = 'completed', updated_at = CURRENT_TIMESTAMP, callback_data = $1
                         WHERE order_reference = $2`,
                        [JSON.stringify(data), orderReference]
                    );

                    // Add credits to user
                    await client.query(
                        `UPDATE users 
                         SET credits = credits + $1, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = $2`,
                        [transaction.credits_added, transaction.user_id]
                    );
                });

                console.log('✅ Credits added successfully:', transaction.credits_added, 'to user:', transaction.user_id);

                const responseTime = Math.floor(Date.now() / 1000);
                const signature = crypto.createHmac('md5', process.env.WAYFORPAY_MERCHANT_SECRET_KEY)
                    .update(`${orderReference};accept;${responseTime}`).digest('hex');

                console.log('✅ Payment processed successfully, responding to WayForPay');
                res.json({ orderReference, status: 'accept', time: responseTime, signature });
            } catch (error) {
                console.error('❌ Payment processing error:', error);
                
                // Mark transaction as failed
                await db.query(
                    `UPDATE transactions 
                     SET status = 'failed', callback_data = $1, updated_at = CURRENT_TIMESTAMP
                     WHERE order_reference = $2`,
                    [JSON.stringify({ error: error.message, callback: data }), orderReference]
                );
                
                res.status(500).json({ error: 'Payment processing failed' });
            }
        } else {
            console.log('ℹ️ Payment not approved:', transactionStatus);
            
            // Update transaction status
            await db.query(
                `UPDATE transactions 
                 SET status = $1, callback_data = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE order_reference = $3`,
                [transactionStatus.toLowerCase(), JSON.stringify(data), orderReference]
            );
            
            res.status(200).send('Callback received');
        }
    } catch (parseError) {
        console.error('❌ Error parsing callback data:', parseError);
        res.status(400).json({ error: 'Invalid JSON data' });
    }
});

// ========== IMAGE TRANSFORMATION (same as before) ==========
// ... (keeping existing image transformation logic)

// ========== DEBUG ENDPOINTS ==========

// Database health check
app.get('/api/health', async (req, res) => {
    const dbHealth = await db.health();
    res.json({
        server: 'healthy',
        database: dbHealth,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NeuroDecor AI Platform Backend',
    version: '2.0.0',
    database: 'PostgreSQL',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
    console.log(`🚀 NeuroDecor Backend v2.0 running on port ${PORT}`);
    console.log(`🗄️ Using PostgreSQL database`);
});

module.exports = app;