require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

// PostgreSQL imports
const db = require('./database/db');
const auth = require('./auth/auth');
const { OAuth2Client } = require('google-auth-library');

// Products configuration (same as before)
const PRODUCTS = {
    'prod_basic_10_credits': { name: 'Базовий', price: 1, credits: 10 },
    'prod_standard_20_credits': { name: 'Стандарт', price: 1400, credits: 20 },
    'prod_prof_60_credits': { name: 'Професійний', price: 3200, credits: 60 }
};

const app = express();
const upload = multer({ dest: 'uploads/' });

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token, profile } = req.body;
        
        if (!token || !profile?.email) {
            return res.status(400).json({ error: 'Invalid Google token or profile data' });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name;
        const picture = payload.picture;
        const googleId = payload.sub;

        // Check if user exists
        let user = await db.queryOne(
            'SELECT id, email, credits, is_active FROM users WHERE email = $1',
            [email]
        );

        if (user) {
            // User exists, log them in
            if (!user.is_active) {
                return res.status(400).json({ error: 'Account is disabled' });
            }
            
            // Update last login
            await db.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );
        } else {
            // Create new user
            user = await db.queryOne(
                `INSERT INTO users (email, password_hash, credits) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, email, credits, created_at`,
                [email, `google_oauth_${googleId}`, 0] // Use Google ID as password placeholder
            );
            
            console.log('✅ New Google user created:', email);
        }

        // Generate JWT token
        const jwtToken = auth.generateToken(user);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: name,
                picture: picture,
                credits: user.credits
            },
            token: jwtToken
        });

    } catch (error) {
        console.error('❌ Google OAuth failed:', error);
        res.status(400).json({ error: 'Google authentication failed' });
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
    const serviceUrl = NGROK_URL ? `${NGROK_URL}/api/payment-callback` : `https://${req.get('host')}/api/payment-callback`;

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
    console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
    
    let data;
    
    // Handle different callback formats
    if (req.headers['content-type']?.includes('application/json')) {
        // JSON format
        data = req.body;
        console.log('📊 JSON callback data:', JSON.stringify(data, null, 2));
    } else {
        // Form-encoded format (WayForPay standard)
        // Check if data is in req.body directly
        if (req.body.orderReference || req.body.transactionStatus) {
            data = req.body;
            console.log('📊 Form-encoded callback data:', JSON.stringify(data, null, 2));
        } else {
            // Try to parse first key as JSON (old format)
            const bodyKey = Object.keys(req.body)[0];
            if (!bodyKey) {
                console.error('❌ No data found in callback');
                return res.status(400).json({ error: 'Invalid callback format' });
            }
            
            try {
                data = JSON.parse(bodyKey);
                console.log('📊 Parsed JSON from key:', JSON.stringify(data, null, 2));
            } catch (parseError) {
                console.error('❌ Failed to parse callback data:', parseError.message);
                console.log('🔍 Raw body keys:', Object.keys(req.body));
                return res.status(400).json({ error: 'Invalid JSON data' });
            }
        }
    }
        
    // Handle different field names that WayForPay might use
    const orderReference = data.orderReference || data.order_reference || data.orderRef;
    const transactionStatus = data.transactionStatus || data.transaction_status || data.reasonCode;
    const amount = data.amount || data.sum;
    
    console.log('🔍 Extracted data:', {
        orderReference,
        transactionStatus, 
        amount,
        allFields: Object.keys(data)
    });
        
    if (!orderReference) {
        console.error('❌ No order reference in callback');
        console.log('🔍 Available fields:', Object.keys(data));
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

        // Check for successful payment status (WayForPay uses different statuses)
        const isSuccessful = ['Approved', 'approved', 'APPROVED', '1'].includes(transactionStatus);
        
        if (isSuccessful) {
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
});

// ========== IMAGE TRANSFORMATION ==========

// Create transformation prompt
const createPrompt = (roomType, furnitureStyle) => {
    const rooms = {
        'living-room': 'living room', 'bedroom': 'bedroom', 'kitchen': 'kitchen',
        'dining-room': 'dining room', 'bathroom': 'bathroom', 'home-office': 'home office'
    };
    
    const styles = {
        'scandinavian': 'Scandinavian style with soft lighting and white wood',
        'modern': 'modern style with sleek furniture and clean lines',
        'minimalist': 'minimalist style with simple furniture and clean surfaces',
        'coastal': 'coastal style with light blue and natural textures',
        'industrial': 'industrial style with exposed brick and metal',
        'traditional': 'traditional style with classic furniture'
    };

    const room = rooms[roomType] || roomType;
    const style = styles[furnitureStyle] || `${furnitureStyle} style`;
    
    return `Transform this ${room} into ${style}. Keep the layout, make it photorealistic.`;
};

// Process image with Flux API
const processWithFlux = async (prompt, imageBuffer, apiKey) => {
    const response = await axios.post('https://api.bfl.ai/v1/flux-kontext-pro', {
        prompt, input_image: imageBuffer.toString('base64')
    }, {
        headers: { 'accept': 'application/json', 'x-key': apiKey, 'Content-Type': 'application/json' }
    });
    
    const pollingUrl = response.data.polling_url;
    if (!pollingUrl) throw new Error('No polling URL received');
    
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await axios.get(pollingUrl, {
            headers: { 'accept': 'application/json', 'x-key': apiKey }
        });
        
        if (result.data.status === 'Ready') {
            const imageResponse = await axios.get(result.data.result.sample, { responseType: 'arraybuffer' });
            return imageResponse.data;
        }
        if (['Error', 'Failed'].includes(result.data.status)) {
            throw new Error(`Generation failed: ${result.data.status}`);
        }
    }
    throw new Error('Generation timed out');
};

// Image transformation endpoint (protected)
app.post('/transform', auth.requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    const { roomType, furnitureStyle } = req.body;
    if (!roomType || !furnitureStyle) {
        return res.status(400).json({ error: 'Room type and style required' });
    }

    try {
        // Check user has credits
        const user = await auth.getUserById(req.user.id);
        if (!user || user.credits <= 0) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        const prompt = createPrompt(roomType, furnitureStyle);
        console.log(`Processing: ${roomType} -> ${furnitureStyle} for user ${req.user.id}`);

        if (process.env.BFL_API_KEY && process.env.BFL_API_KEY !== 'YOUR_API_KEY_HERE') {
            const fs = require('fs');
            const imageBuffer = fs.readFileSync(req.file.path);
            const result = await processWithFlux(prompt, imageBuffer, process.env.BFL_API_KEY);
            
            // Deduct credit after successful generation
            await auth.deductCredits(req.user.id, 1);
            console.log(`✅ Credit deducted for user ${req.user.id}`);
            
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            res.set('Content-Type', 'image/jpeg');
            res.send(result);
        } else {
            res.status(500).json({ error: 'API key not configured' });
        }
        
    } catch (error) {
        console.error('Transform error:', error.message);
        
        // Clean up uploaded file on error
        try {
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError.message);
        }
        
        res.status(500).json({ error: 'Transform failed', details: error.message });
    }
});

// ========== DEBUG ENDPOINTS ==========

// Test callback endpoint with different formats
app.post('/api/test-callback', async (req, res) => {
    console.log('🧪 TEST CALLBACK RECEIVED:', Date.now());
    console.log('📋 Test body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Test headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Body keys:', Object.keys(req.body));
    
    res.json({
        success: true,
        receivedData: req.body,
        headers: req.headers,
        contentType: req.headers['content-type']
    });
});

// Debug Service URL generation
app.get('/api/debug-service-url', (req, res) => {
    const { NGROK_URL } = process.env;
    const serviceUrl = NGROK_URL ? `${NGROK_URL}/api/payment-callback` : `https://${req.get('host')}/api/payment-callback`;
    
    console.log('🔍 DEBUG Service URL generation:');
    console.log('  NGROK_URL env var:', NGROK_URL || 'not set');
    console.log('  req.protocol:', req.protocol);
    console.log('  req.get("host"):', req.get('host'));
    console.log('  Final serviceUrl:', serviceUrl);
    console.log('  🔧 FIXED: Using HTTPS instead of HTTP for callback URL');
    
    res.json({
        success: true,
        ngrokUrl: NGROK_URL || null,
        protocol: req.protocol,
        host: req.get('host'),
        finalServiceUrl: serviceUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        note: "Fixed: Using HTTPS for callback URL to ensure WayForPay can reach the endpoint"
    });
});

// Manual payment processing endpoint (for debugging)
app.post('/api/manual-complete-payment', async (req, res) => {
    try {
        const { orderReference } = req.body;
        
        if (!orderReference) {
            return res.status(400).json({ error: 'Order reference required' });
        }

        // Find transaction
        const transaction = await db.queryOne(
            'SELECT * FROM transactions WHERE order_reference = $1',
            [orderReference]
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status === 'completed') {
            return res.status(400).json({ error: 'Transaction already completed' });
        }

        console.log('🔧 Manual payment processing:', orderReference);

        // Use database transaction for atomicity
        await db.transaction(async (client) => {
            // Update transaction status
            await client.query(
                `UPDATE transactions 
                 SET status = 'completed', updated_at = CURRENT_TIMESTAMP, callback_data = $1
                 WHERE order_reference = $2`,
                [JSON.stringify({ manual: true, timestamp: Date.now() }), orderReference]
            );

            // Add credits to user
            await client.query(
                `UPDATE users 
                 SET credits = credits + $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2`,
                [transaction.credits_added, transaction.user_id]
            );
        });

        console.log('✅ Manual payment processed - Credits added:', transaction.credits_added, 'to user:', transaction.user_id);

        res.json({
            success: true,
            orderReference,
            creditsAdded: transaction.credits_added,
            userId: transaction.user_id
        });

    } catch (error) {
        console.error('❌ Manual payment processing error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

// List pending transactions endpoint
app.get('/api/pending-transactions', async (req, res) => {
    try {
        const transactions = await db.query(
            'SELECT * FROM transactions WHERE status = $1 ORDER BY created_at DESC',
            ['pending']
        );

        res.json({
            success: true,
            transactions: transactions.rows
        });
    } catch (error) {
        console.error('❌ Failed to get pending transactions:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

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

// Simple health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 NeuroDecor Backend v2.0 running on port ${PORT}`);
    console.log(`🗄️ Using PostgreSQL database`);
});

module.exports = app;