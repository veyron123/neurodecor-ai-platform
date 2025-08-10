// Test Firebase connection
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC3iEskjgqXA3BTezc4Kg8zUuOnnch3I_U",
  authDomain: "my-new-home-design-app.firebaseapp.com",
  projectId: "my-new-home-design-app",
  storageBucket: "my-new-home-design-app.firebasestorage.app",
  messagingSenderId: "874060215664",
  appId: "1:874060215664:web:a6b849473b3a4535cfcbb5"
};

async function testFirebase() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase app initialized');
    
    // Test basic connection
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { 
      timestamp: new Date(),
      status: 'test'
    });
    
    console.log('✅ Firestore write test successful');
    console.log('🎉 Firebase connection is working!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.code, error.message);
    
    if (error.code === 'failed-precondition') {
      console.log('\n🚨 SOLUTION: Cloud Firestore API is not enabled!');
      console.log('👉 Enable it here: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=my-new-home-design-app');
    } else if (error.code === 'permission-denied') {
      console.log('\n🚨 SOLUTION: Firestore security rules are too restrictive!');
      console.log('👉 Update rules in Firebase Console');
    }
  }
}

testFirebase();