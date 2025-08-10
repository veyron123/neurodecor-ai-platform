// Firebase configuration with enhanced error handling and debugging
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";

// Validate Firebase configuration
const validateConfig = (config) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  // Check for quotes in environment variables (common issue)
  Object.keys(config).forEach(key => {
    if (typeof config[key] === 'string' && (config[key].startsWith('"') || config[key].startsWith("'"))) {
      console.warn(`Firebase config field "${key}" contains quotes. Removing them.`);
      config[key] = config[key].replace(/^["']|["']$/g, '');
    }
  });
  
  return config;
};

// Firebase configuration from environment variables
const firebaseConfig = validateConfig({
  apiKey: process.env.REACT_APP_API_KEY?.replace(/^["']|["']$/g, ''),
  authDomain: process.env.REACT_APP_AUTH_DOMAIN?.replace(/^["']|["']$/g, ''),
  projectId: process.env.REACT_APP_PROJECT_ID?.replace(/^["']|["']$/g, ''),
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET?.replace(/^["']|["']$/g, ''),
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID?.replace(/^["']|["']$/g, ''),
  appId: process.env.REACT_APP_APP_ID?.replace(/^["']|["']$/g, '')
});

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Connect to emulators if in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

// Enhanced Firestore error handling
export const handleFirestoreError = (error) => {
  console.error('Firestore error:', error);
  
  if (error.code === 'permission-denied') {
    console.error('Firestore permission denied. Check your security rules.');
    return 'Permission denied. Please check your authentication status.';
  }
  
  if (error.code === 'unavailable') {
    console.error('Firestore is unavailable. Check your internet connection.');
    return 'Database is currently unavailable. Please try again later.';
  }
  
  if (error.code === 'failed-precondition') {
    console.error('Firestore failed precondition. This might be an index issue.');
    return 'Database operation failed. Please contact support.';
  }
  
  if (error.message?.includes('WebChannelConnection')) {
    console.error('WebChannel connection error. This might be a CORS or network issue.');
    return 'Connection error. Please check your network settings.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Network connectivity helper
export const checkFirestoreConnection = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore network enabled');
    return true;
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
    return false;
  }
};

// Retry mechanism for Firestore operations
export const retryFirestoreOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        console.log(`Retrying Firestore operation (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay * i));
      }
      
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Firestore operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      // Don't retry on permission errors
      if (error.code === 'permission-denied') {
        throw error;
      }
    }
  }
  
  throw lastError;
};

export default app;