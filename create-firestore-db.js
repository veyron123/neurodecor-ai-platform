// Initialize Firestore database by creating initial document
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC3iEskjgqXA3BTezc4Kg8zUuOnnch3I_U",
  authDomain: "my-new-home-design-app.firebaseapp.com",
  projectId: "my-new-home-design-app",
  storageBucket: "my-new-home-design-app.firebasestorage.app",
  messagingSenderId: "874060215664",
  appId: "1:874060215664:web:a6b849473b3a4535cfcbb5"
};

async function createFirestoreDB() {
  try {
    console.log('🔍 Initializing Firestore database...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Create initial collections and documents
    console.log('📝 Creating initial system document...');
    const systemRef = doc(db, 'system', 'config');
    await setDoc(systemRef, {
      version: '1.0.0',
      created: new Date(),
      status: 'active'
    });
    
    console.log('👤 Creating users collection...');
    const sampleUserRef = doc(db, 'users', 'sample');
    await setDoc(sampleUserRef, {
      email: 'sample@example.com',
      credits: 0,
      created: new Date()
    });
    
    console.log('💳 Creating transactions collection...');
    const sampleTransactionRef = doc(db, 'transactions', 'sample');
    await setDoc(sampleTransactionRef, {
      userId: 'sample',
      amount: 0,
      status: 'sample',
      created: new Date()
    });
    
    console.log('✅ Firestore database initialized successfully!');
    console.log('🎉 You can now use Firebase in your application.');
    
  } catch (error) {
    console.error('❌ Failed to create Firestore database:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n🚨 SOLUTION: Enable Firestore in Firebase Console:');
      console.log('👉 https://console.firebase.google.com/project/my-new-home-design-app/firestore');
      console.log('👉 Click "Create database" and choose your region');
    }
  }
}

createFirestoreDB();