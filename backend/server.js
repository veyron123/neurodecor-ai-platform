require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Firebase initialization
let db;
if (process.env.FIREBASE_ADMIN_KEY) {
  // Production: use environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  console.log('✅ Firebase initialized with environment variable');
} else {
  try {
    // Development: use local file
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    console.log('✅ Firebase initialized with local file');
  } catch (error) {
    console.log('⚠️ Firebase not initialized - no serviceAccountKey.json found');
    console.log('Authentication and payments will work in demo mode');
    // Mock db object to prevent crashes
    db = { 
      collection: () => ({ 
        doc: () => ({ 
          update: () => Promise.resolve(), 
          collection: () => ({ 
            doc: () => ({ 
              set: () => Promise.resolve() 
            }) 
          }) 
        }) 
      }) 
    };
  }
}

// Products configuration
const PRODUCTS = {
  'prod_basic_8_credits': { name: 'Базовий', price: 1, credits: 8 },
  'prod_standard_20_credits': { name: 'Стандарт', price: 1400, credits: 20 },
  'prod_prof_60_credits': { name: 'Професійний', price: 3200, credits: 60 }
};

const app = express();
const PORT = process.env.PORT || 3007;

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002', 
  'http://localhost:3006',
  'https://neurodecor-frontend.onrender.com',
  'https://neurodecor.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isValidType = ['image/jpeg', 'image/png'].includes(file.mimetype);
        cb(isValidType ? null : new Error('Only JPG and PNG files allowed'), isValidType);
    }
});

// Simple prompt generator
const createPrompt = (roomType, furnitureStyle) => {
    const rooms = {
        'bedroom': 'bedroom', 'living-room': 'living room', 'kitchen': 'kitchen',
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

// Simplified image processing functions
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

// Main transform endpoint
app.post('/transform', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    const { roomType, furnitureStyle } = req.body;
    if (!roomType || !furnitureStyle) {
        return res.status(400).json({ error: 'Room type and style required' });
    }

    try {
        const prompt = createPrompt(roomType, furnitureStyle);
        console.log(`Processing: ${roomType} -> ${furnitureStyle}`);

        if (process.env.BFL_API_KEY && process.env.BFL_API_KEY !== 'YOUR_API_KEY_HERE') {
            const imageData = await processWithFlux(prompt, req.file.buffer, process.env.BFL_API_KEY);
            res.setHeader('Content-Type', 'image/png');
            return res.send(imageData);
        }
        
        // Demo mode - return original after delay
        console.log('Demo mode: returning original image');
        await new Promise(resolve => setTimeout(resolve, 2000));
        res.setHeader('Content-Type', req.file.mimetype);
        res.send(req.file.buffer);
        
    } catch (error) {
        console.error('Transform error:', error.message);
        res.status(500).json({ error: 'Transform failed', details: error.message });
    }
});

// Create payment endpoint
app.post('/api/create-payment', (req, res) => {
    const { userId, productId } = req.body;
    
    if (!userId || !productId || !PRODUCTS[productId]) {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    const product = PRODUCTS[productId];
    const { WAYFORPAY_MERCHANT_ACCOUNT, WAYFORPAY_MERCHANT_SECRET_KEY, NGROK_URL } = process.env;
    
    if (!WAYFORPAY_MERCHANT_ACCOUNT || !WAYFORPAY_MERCHANT_SECRET_KEY) {
        return res.status(500).json({ error: 'Payment system not configured' });
    }

    const orderReference = `WFP-${productId}-${userId}-${Date.now()}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const serviceUrl = NGROK_URL ? `${NGROK_URL}/api/payment-callback` : `${req.protocol}://${req.get('host')}/api/payment-callback`;

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
});


// Payment callback endpoint
app.post('/api/payment-callback', async (req, res) => {
    const bodyKey = Object.keys(req.body)[0];
    if (!bodyKey) return res.status(400).json({ error: 'Invalid callback format' });
    
    const data = JSON.parse(bodyKey);
    const { orderReference, transactionStatus, amount } = data;
    const [, productId, userId] = orderReference.split('-');
    
    if (!orderReference || !userId || !PRODUCTS[productId]) {
        return res.status(400).json({ error: 'Invalid payment data' });
    }

    if (transactionStatus === 'Approved') {
        try {
            const creditsToAdd = PRODUCTS[productId].credits;
            const userRef = db.collection('users').doc(userId);
            
            await userRef.update({ credits: admin.firestore.FieldValue.increment(creditsToAdd) });
            await userRef.collection('transactions').doc(orderReference).set({
                status: 'completed', amount: Number(amount), creditsAdded: creditsToAdd,
                createdAt: new Date(), paymentSystem: 'WayForPay'
            });

            const responseTime = Math.floor(Date.now() / 1000);
            const signature = crypto.createHmac('md5', process.env.WAYFORPAY_MERCHANT_SECRET_KEY)
                .update(`${orderReference};accept;${responseTime}`).digest('hex');

            res.json({ orderReference, status: 'accept', time: responseTime, signature });
        } catch (error) {
            console.error('Payment processing error:', error);
            res.status(500).json({ error: 'Payment processing failed' });
        }
    } else {
        res.status(200).send('Callback received');
    }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NeuroDecor AI Platform Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      transform: '/api/transform-room',
      payment: '/api/process-payment',
      callback: '/api/payment-callback'
    },
    docs: 'https://github.com/veyron123/neurodecor-ai-platform'
  });
});

// Favicon endpoint (prevents 404 in logs)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Enhanced health check for Render
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    services: {
      firebase: !!db,
      flux: !!(process.env.BFL_API_KEY && process.env.BFL_API_KEY !== 'YOUR_API_KEY_HERE'),
      payments: !!(process.env.WAYFORPAY_MERCHANT_ACCOUNT)
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    uptime: Math.round(process.uptime()) + 's'
  };
  
  res.json(health);
});

// Error handling
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (10MB max)' });
    }
    if (error.message.includes('Only JPG and PNG')) {
        return res.status(400).json({ error: 'Only JPG/PNG files allowed' });
    }
    res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(process.env.BFL_API_KEY && process.env.BFL_API_KEY !== 'YOUR_API_KEY_HERE' 
        ? '✅ Flux.1 API ready' : '⚠️ Demo mode (no API key)');
});