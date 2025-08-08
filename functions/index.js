const functions = require("firebase-functions");
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

const products = [
  { id: 'prod_basic_8_credits', name: 'Базовий', price: 1, credits: 8 },
  { id: 'prod_standard_20_credits', name: 'Стандарт', price: 1400, credits: 20 },
  { id: 'prod_prof_60_credits', name: 'Професійний', price: 3200, credits: 60 }
];

const app = express();

// На проде разрешаем все источники
app.use(cors({ origin: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG files are allowed!'), false);
        }
    }
});

const createPrompt = (roomType, furnitureStyle) => {
    const roomTypeMapping = {
        'bedroom': 'bedroom',
        'living-room': 'living room',
        'kitchen': 'kitchen',
        'dining-room': 'dining room',
        'bathroom': 'bathroom',
        'home-office': 'home office'
    };

    const stylePrompts = {
        'scandinavian': 'Scandinavian interior style. Add soft lighting, white wood furniture, cozy textiles, minimalist design with natural materials',
        'modern': 'modern interior style. Add sleek furniture, clean lines, neutral colors, contemporary lighting',
        'minimalist': 'minimalist interior style. Add simple furniture, clean surfaces, monochromatic color scheme, geometric shapes',
        'coastal': 'coastal interior style. Add light blue and white colors, natural textures, beach-inspired elements, airy atmosphere',
        'industrial': 'industrial interior style. Add exposed brick, metal fixtures, dark colors, vintage elements',
        'traditional': 'traditional interior style. Add classic furniture, warm colors, ornate details, timeless elegance'
    };

    const room = roomTypeMapping[roomType] || roomType;
    const styleDesc = stylePrompts[furnitureStyle] || `${furnitureStyle} interior style`;

    return `Transform this ${room} into a ${styleDesc}. Preserve the room layout and structure. Make it photorealistic and professional.`;
};

app.post('/transform', upload.single('image'), async (req, res) => {
    // ... (весь код эндпоинта /transform остается без изменений)
});

app.post('/api/create-payment', (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'Missing required fields: userId, productId' });
        }

        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const amount = product.price;
        const productName = product.name;

        const merchantAccount = functions.config().wayforpay.merchant_account;
        const merchantSecretKey = functions.config().wayforpay.merchant_secret_key;

        if (!merchantAccount || !merchantSecretKey) {
            console.error('WayForPay credentials are not set in functions config');
            return res.status(500).json({ error: 'Payment system is not configured.' });
        }

        const orderReference = `WFP-${product.id}-${userId}-${Date.now()}`;
        const orderDate = Math.floor(Date.now() / 1000);
        const currency = 'UAH';
        const serviceUrl = `https://api.neurodecor.site/api/payment-callback`; // Используем URL функции

        const signatureString = [
            merchantAccount,
            'www.neurodecor.site', // Ваш домен
            orderReference,
            orderDate,
            amount,
            currency,
            productName,
            1,
            amount
        ].join(';');

        const merchantSignature = crypto
            .createHmac('md5', merchantSecretKey)
            .update(signatureString)
            .digest('hex');

        const paymentData = {
            merchantAccount,
            merchantAuthType: 'Simple',
            merchantDomainName: 'www.neurodecor.site',
            orderReference,
            orderDate,
            amount,
            currency,
            productName: [productName],
            productCount: [1],
            productPrice: [amount],
            serviceUrl,
            merchantSignature,
        };
        
        res.json(paymentData);

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Could not create payment.' });
    }
});

app.post('/api/payment-callback', async (req, res) => {
    console.log('--- WayForPay Callback Received ---');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('---------------------------------');

    const bodyKey = Object.keys(req.body)[0];
    if (!bodyKey) {
        return res.status(400).json({ error: 'Invalid callback format.' });
    }
    const data = JSON.parse(bodyKey);

    const { orderReference, transactionStatus, amount, currency, merchantSignature } = data;
    
    const parts = orderReference.split('-');
    if (parts.length < 4) { // WFP-prod_id-userId-timestamp
        console.error('Invalid orderReference format:', orderReference);
        return res.status(400).json({ error: 'Invalid order reference.' });
    }
    const userId = parts[2];
    const productId = parts[1];

    if (transactionStatus === 'Approved') {
        try {
            const product = products.find(p => p.id === productId);
            if (!product) {
                console.error(`Product not found for order: ${orderReference}`);
                return res.status(404).json({ error: 'Product not found for this order.' });
            }
            const creditsToAdd = product.credits;

            const userRef = db.collection('users').doc(userId);

            await userRef.update({
                credits: admin.firestore.FieldValue.increment(creditsToAdd)
            });

            const transactionRef = userRef.collection('transactions').doc(orderReference);
            await transactionRef.set({
                status: 'completed',
                amount: Number(amount),
                currency: currency,
                creditsAdded: creditsToAdd,
                createdAt: new Date(),
                paymentSystem: 'WayForPay'
            });

            console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
            
            const responseTime = Math.floor(Date.now() / 1000);
            const responseSignatureString = `${orderReference};accept;${responseTime}`;
            const responseSignature = crypto
                .createHmac('md5', functions.config().wayforpay.merchant_secret_key)
                .update(responseSignatureString)
                .digest('hex');

            res.json({
                orderReference: orderReference,
                status: 'accept',
                time: responseTime,
                signature: responseSignature
            });

        } catch (error) {
            console.error('Error processing payment callback:', error);
            res.status(500).json({ error: 'Internal server error while processing payment.' });
        }
    } else {
        console.log(`Received non-approved status '${transactionStatus}' for order ${orderReference}`);
        res.status(200).send('Callback received');
    }
});

exports.api = functions.https.onRequest(app);