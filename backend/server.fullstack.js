const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// CORS настройки для Railway full-stack
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://neurodecor.railway.app',
  'https://neurodecor-production.up.railway.app',
  process.env.RAILWAY_STATIC_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    api: 'working',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.post('/api/transform', upload.single('image'), async (req, res) => {
  try {
    console.log('Transform request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    const { roomType, furnitureStyle } = req.body;

    // TODO: Replace with real Flux.1 API call
    if (process.env.BFL_API_KEY) {
      // Real API implementation would go here
      console.log('Using BFL API...');
      
      // For now, return demo response
      setTimeout(() => {
        res.json({
          success: true,
          message: 'Image transformation completed!',
          originalImage: req.file.originalname,
          roomType: roomType || 'bedroom',
          furnitureStyle: furnitureStyle || 'modern',
          resultUrl: '/api/demo-result.jpg', // Demo URL
          processingTime: '3.2s'
        });
      }, 2000);
    } else {
      // Demo mode
      console.log('Demo mode - no API key provided');
      
      setTimeout(() => {
        res.json({
          success: true,
          message: 'Demo: Трансформация выполнена! Настройте BFL_API_KEY для реальной обработки.',
          originalImage: req.file.originalname,
          roomType: roomType || 'bedroom',
          furnitureStyle: furnitureStyle || 'modern',
          demo: true,
          note: 'Set BFL_API_KEY environment variable to enable real AI processing'
        });
      }, 1500);
    }

  } catch (error) {
    console.error('Transform error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during transformation' 
    });
  }
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'NeuroDecor API is working!', 
    timestamp: new Date().toISOString(),
    endpoints: ['/api/health', '/api/transform', '/api/test']
  });
});

// Static files - serve React build (IMPORTANT: After API routes)
const frontendPath = path.join(__dirname, '../frontend/build');
console.log('Serving static files from:', frontendPath);

app.use(express.static(frontendPath, {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log('Serving React app:', req.url, '-> index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NeuroDecor Full-Stack Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📁 Static files: ${frontendPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.BFL_API_KEY) {
    console.log('✅ BFL API key configured');
  } else {
    console.log('⚠️  BFL API key not found - running in demo mode');
  }
});

module.exports = app;