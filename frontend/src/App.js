import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import './App.css';
import { auth, db, handleFirestoreError, retryFirestoreOperation } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { demoPaymentSystem } from './utils/demo-payment';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Header from './components/Header';
import SimpleRoomTransformer from './components/SimpleRoomTransformer';
import HeroSlider from './components/HeroSlider';
import HowItWorks from './components/HowItWorks';
import Marketing from './components/Marketing';
import Gallery from './components/Gallery';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

const LoginModal = lazy(() => import('./components/LoginModal'));
const ContactModal = lazy(() => import('./components/ContactModal'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const Sitemap = lazy(() => import('./components/Sitemap'));

const HomePage = ({ handleOpenModal, credits, deductCredit, onCreditsUpdate }) => {
  const { lang } = useParams();

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      <div className="main-container">
        <HeroSlider />
        <HowItWorks />
        <div className="transformer-section">
          <SimpleRoomTransformer credits={credits} deductCredit={deductCredit} />
        </div>
        <Marketing />
        <Gallery />
      </div>
      <Pricing onSubscribeClick={handleOpenModal} onCreditsUpdate={onCreditsUpdate} />
      <div className="main-container">
        <FAQ />
      </div>
    </>
  );
};

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // Initialize demo system as fallback only
    demoPaymentSystem.init();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        setIsLoginModalOpen(false);
        // PRODUCTION MODE: Always fetch Firebase credits for authenticated users
        fetchCredits(currentUser.uid);
        console.log('🔄 PRODUCTION MODE: Loading Firebase credits for authenticated user');
      } else {
        // Non-authenticated users start with 0 credits (require login)
        setCredits(0);
        console.log('👤 Non-authenticated user - login required for credits');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCredits = async (uid) => {
    // PRODUCTION MODE: Firebase first, demo only as emergency fallback
    const userDocRef = doc(db, 'users', uid);
    try {
      const userDoc = await retryFirestoreOperation(async () => {
        return await getDoc(userDocRef);
      });
      if (userDoc.exists()) {
        const firebaseCredits = userDoc.data().credits || 0;
        setCredits(firebaseCredits);
        console.log('🔥 PRODUCTION: Using Firebase credits:', firebaseCredits);
      } else {
        // Create user document if it doesn't exist with 0 credits
        console.log('🆕 Creating new user document with 0 credits');
        await retryFirestoreOperation(async () => {
          return await updateDoc(userDocRef, { credits: 0 });
        });
        setCredits(0);
      }
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      console.error("⚠️ Firebase not available, emergency fallback to demo:", errorMessage);
      
      // Emergency fallback to demo system only if Firebase completely fails
      const demoCredits = demoPaymentSystem.getDemoCredits();
      setCredits(demoCredits);
      console.log('🚨 Emergency demo fallback:', demoCredits);
    }
  };

  const deductCredit = async () => {
    console.log('🎯 deductCredit called! Current credits:', credits, 'User:', user ? 'authenticated' : 'guest');
    
    if (credits > 0) {
      // PRODUCTION MODE: Firebase first, demo as fallback only
      if (user) {
        console.log('🔄 Using Firebase for authenticated user...');
        const userDocRef = doc(db, 'users', user.uid);
        const newCredits = Math.max(0, credits - 1);
        try {
          await retryFirestoreOperation(async () => {
            return await updateDoc(userDocRef, {
              credits: newCredits
            });
          });
          setCredits(newCredits);
          console.log('✅ Firebase credits updated:', newCredits, '(PRODUCTION MODE)');
          return; // Exit early - Firebase worked
        } catch (error) {
          const errorMessage = handleFirestoreError(error);
          console.error('❌ Firebase failed, trying demo fallback:', errorMessage);
          // Fallback to demo system only if Firebase fails
          if (demoPaymentSystem.useCredit()) {
            const demoCredits = demoPaymentSystem.getDemoCredits();
            setCredits(demoCredits);
            console.log('✅ Demo credits updated as fallback:', demoCredits);
            return;
          }
        }
      } else {
        // Non-authenticated users require login for real payments
        console.log('⚠️ Non-authenticated user - login required for real payments');
        alert('Пожалуйста, войдите в систему для покупки и использования кредитов');
        return;
      }
      
      // If all systems fail, set credits anyway for UX
      setCredits(Math.max(0, credits - 1));
    } else {
      console.log('⚠️ No credits available to deduct');
      alert('У вас недостаточно кредитов. Пожалуйста, купите больше кредитов.');
    }
  };

  const handleOpenLoginModal = () => setIsLoginModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCreditsUpdate = (newCredits) => setCredits(newCredits);

  const handleOpenContactModal = () => setIsContactModalOpen(true);
  const handleCloseContactModal = () => setIsContactModalOpen(false);

  const handleSignOut = () => {
    signOut(auth);
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <Router>
      <div className="App">
        <Header user={user} onLoginClick={handleOpenLoginModal} onSignOut={handleSignOut} />
        <main>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage handleOpenModal={handleOpenLoginModal} credits={credits} deductCredit={deductCredit} onCreditsUpdate={handleCreditsUpdate} />} />
              <Route path="/:lang" element={<HomePage handleOpenModal={handleOpenLoginModal} credits={credits} deductCredit={deductCredit} onCreditsUpdate={handleCreditsUpdate} />} />
              <Route path="/:lang/dashboard" element={user ? <Dashboard credits={credits} deductCredit={deductCredit} /> : <Navigate to="/" />} />
              <Route path="/:lang/terms" element={<TermsOfService />} />
              <Route path="/:lang/privacy" element={<PrivacyPolicy />} />
              <Route path="/:lang/sitemap" element={<Sitemap />} />
            </Routes>
          </Suspense>
        </main>
        <Footer onContactsClick={handleOpenContactModal} />
        <Suspense fallback={<div />}>
          <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
          <ContactModal isOpen={isContactModalOpen} onClose={handleCloseContactModal} />
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
