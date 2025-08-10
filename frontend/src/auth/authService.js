// JWT Authentication Service - replacing Firebase Auth
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://neurodecor-backend.onrender.com';

// Auth state management
let currentUser = null;
let authToken = null;
let authListeners = [];

// Initialize auth from localStorage
const initAuth = () => {
  const token = localStorage.getItem('neurodecor_token');
  const userData = localStorage.getItem('neurodecor_user');
  
  if (token && userData) {
    try {
      authToken = token;
      currentUser = JSON.parse(userData);
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token is still valid
      verifyToken().catch(() => {
        // Token invalid, clear auth
        signOut();
      });
      
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      signOut();
    }
  }
};

// Verify token with backend
const verifyToken = async () => {
  if (!authToken) return null;
  
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`);
    if (response.data.success) {
      currentUser = response.data.user;
      localStorage.setItem('neurodecor_user', JSON.stringify(currentUser));
      notifyAuthListeners();
      return currentUser;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    signOut();
    return null;
  }
};

// Register new user
const register = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password
    });
    
    if (response.data.success) {
      const { user, token } = response.data;
      
      // Store auth data
      authToken = token;
      currentUser = user;
      localStorage.setItem('neurodecor_token', token);
      localStorage.setItem('neurodecor_user', JSON.stringify(user));
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      notifyAuthListeners();
      return { user };
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

// Sign in existing user
const signIn = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      const { user, token } = response.data;
      
      // Store auth data
      authToken = token;
      currentUser = user;
      localStorage.setItem('neurodecor_token', token);
      localStorage.setItem('neurodecor_user', JSON.stringify(user));
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      notifyAuthListeners();
      return { user };
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};

// Google OAuth sign in
const signInWithGoogle = async (googleResponse) => {
  try {
    console.log('🔐 Google OAuth - Sending request to backend:', {
      token: googleResponse.tokenId ? 'present' : 'missing',
      email: googleResponse.profileObj?.email,
      name: googleResponse.profileObj?.name
    });

    const response = await axios.post(`${API_URL}/api/auth/google`, {
      token: googleResponse.tokenId,
      profile: {
        email: googleResponse.profileObj.email,
        name: googleResponse.profileObj.name,
        picture: googleResponse.profileObj.imageUrl,
        googleId: googleResponse.profileObj.googleId
      }
    });
    
    if (response.data.success) {
      const { user, token } = response.data;
      
      // Store auth data
      authToken = token;
      currentUser = user;
      localStorage.setItem('neurodecor_token', token);
      localStorage.setItem('neurodecor_user', JSON.stringify(user));
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      notifyAuthListeners();
      console.log('✅ Google OAuth success:', user.email);
      return { user };
    }
  } catch (error) {
    console.error('❌ Google OAuth failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Google sign in failed');
  }
};

// Sign out user
const signOut = async () => {
  authToken = null;
  currentUser = null;
  
  // Clear storage
  localStorage.removeItem('neurodecor_token');
  localStorage.removeItem('neurodecor_user');
  
  // Clear axios header
  delete axios.defaults.headers.common['Authorization'];
  
  notifyAuthListeners();
};

// Get current user
const getCurrentUser = () => {
  return currentUser;
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!currentUser && !!authToken;
};

// Get current auth token
const getToken = () => {
  return authToken;
};

// Auth state change listener
const onAuthStateChanged = (callback) => {
  authListeners.push(callback);
  
  // Call immediately with current state
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};

// Notify all listeners of auth state change
const notifyAuthListeners = () => {
  authListeners.forEach(callback => callback(currentUser));
};

// Get user credits
const getUserCredits = async () => {
  if (!isAuthenticated()) return 0;
  
  try {
    const response = await axios.get(`${API_URL}/api/credits`);
    if (response.data.success) {
      // Update current user credits
      currentUser.credits = response.data.credits;
      localStorage.setItem('neurodecor_user', JSON.stringify(currentUser));
      notifyAuthListeners();
      return response.data.credits;
    }
  } catch (error) {
    console.error('Failed to get user credits:', error);
    return currentUser?.credits || 0;
  }
};

// Deduct user credits
const deductCredits = async (amount = 1) => {
  if (!isAuthenticated()) throw new Error('User not authenticated');
  
  try {
    const response = await axios.post(`${API_URL}/api/credits/deduct`, {
      credits: amount
    });
    
    if (response.data.success) {
      // Update current user credits
      currentUser.credits = response.data.creditsRemaining;
      localStorage.setItem('neurodecor_user', JSON.stringify(currentUser));
      notifyAuthListeners();
      return response.data.creditsRemaining;
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to deduct credits');
  }
};

// Initialize auth on module load
initAuth();

// Export auth service
export const authService = {
  register,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  isAuthenticated,
  getToken,
  onAuthStateChanged,
  getUserCredits,
  deductCredits,
  verifyToken
};

// Export individual functions for compatibility
export {
  register,
  signIn,
  signOut,
  getCurrentUser,
  isAuthenticated,
  getToken,
  onAuthStateChanged,
  getUserCredits,
  deductCredits
};