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

const HomePage = ({ handleOpenModal, credits, deductCredit }) => {
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
      <Pricing onSubscribeClick={handleOpenModal} />
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        setIsLoginModalOpen(false);
        fetchCredits(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCredits = async (uid) => {
    const userDocRef = doc(db, 'users', uid);
    try {
      const userDoc = await retryFirestoreOperation(async () => {
        return await getDoc(userDocRef);
      });
      if (userDoc.exists()) {
        setCredits(userDoc.data().credits || 0);
      } else {
        // Create user document if it doesn't exist
        console.log('User document not found, creating default...');
        setCredits(0);
      }
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      console.error("Firebase not available, using demo credits:", errorMessage);
      
      // Use demo system if Firebase fails
      const demoCredits = demoPaymentSystem.getDemoCredits();
      setCredits(demoCredits);
    }
  };

  const deductCredit = async () => {
    if (user && credits > 0) {
      const userDocRef = doc(db, 'users', user.uid);
      const newCredits = Math.max(0, credits - 1);
      try {
        await retryFirestoreOperation(async () => {
          return await updateDoc(userDocRef, {
            credits: newCredits
          });
        });
        setCredits(newCredits);
      } catch (error) {
        const errorMessage = handleFirestoreError(error);
        console.error('Firebase not available, using demo system:', errorMessage);
        
        // Use demo system if Firebase fails
        if (demoPaymentSystem.useCredit()) {
          setCredits(demoPaymentSystem.getDemoCredits());
        }
      }
    }
  };

  const handleOpenLoginModal = () => setIsLoginModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);

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
              <Route path="/" element={<HomePage handleOpenModal={handleOpenLoginModal} credits={credits} deductCredit={deductCredit} />} />
              <Route path="/:lang" element={<HomePage handleOpenModal={handleOpenLoginModal} credits={credits} deductCredit={deductCredit} />} />
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
