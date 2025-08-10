const { verifyIdToken } = require('../config/firebase-admin');

// Middleware to verify Firebase ID token
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For payment endpoints, we might get userId in body
      if (req.body.userId && (req.path.includes('/create-payment') || req.path.includes('/webhook'))) {
        req.user = { uid: req.body.userId };
        return next();
      }
      
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authorization token provided' 
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await verifyIdToken(idToken);
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired', 
        message: 'Your session has expired. Please log in again.' 
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'The provided token is invalid.' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: 'Failed to authenticate user' 
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyIdToken(idToken);
      req.user = decodedToken;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    console.log('Optional auth failed, continuing without user context');
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
};