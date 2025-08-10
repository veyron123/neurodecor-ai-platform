const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized');
      return admin.app();
    }

    // Initialize with Application Default Credentials or service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account from environment variable (JSON string)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'my-new-home-design-app'
      });
      console.log('Firebase Admin initialized with service account');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account from file path
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'my-new-home-design-app'
      });
      console.log('Firebase Admin initialized with application default credentials');
    } else {
      // Initialize without credentials (for local development)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'my-new-home-design-app'
      });
      console.log('Firebase Admin initialized without credentials (development mode)');
    }

    return admin.app();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
};

// Initialize on module load
const app = initializeFirebaseAdmin();

// Export initialized services
module.exports = {
  admin,
  firestore: admin.firestore(),
  auth: admin.auth(),
  
  // Helper function to verify ID tokens
  verifyIdToken: async (idToken) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw error;
    }
  },
  
  // Helper function to get or create user
  getOrCreateUser: async (uid, email, displayName) => {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    
    try {
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // Create new user document
        const userData = {
          uid,
          email,
          displayName: displayName || email,
          credits: 0, // Start with 0 credits
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await userRef.set(userData);
        console.log('Created new user document:', uid);
        return userData;
      }
      
      return userDoc.data();
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  },
  
  // Helper function to update user credits
  updateUserCredits: async (uid, credits) => {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    
    try {
      await userRef.update({
        credits,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Updated credits for user ${uid}: ${credits}`);
      return true;
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  }
};