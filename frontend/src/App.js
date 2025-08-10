import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import './App.css';
import { authService } from './auth/authService';
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
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        setIsLoginModalOpen(false);
        // Fetch PostgreSQL credits for authenticated users
        fetchCredits();
        console.log('🔄 PostgreSQL AUTH: Loading user credits for:', currentUser.email);
      } else {
        // Non-authenticated users start with 0 credits (require login)
        setCredits(0);
        console.log('👤 Not authenticated - login required for credits');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCredits = async () => {
    try {
      const userCredits = await authService.getUserCredits();
      setCredits(userCredits);
      console.log(`✅ PostgreSQL credits loaded: ${userCredits}`);
    } catch (error) {
      console.error('❌ Failed to fetch PostgreSQL credits:', error);
      setCredits(0);
    }
  };

  const deductCredit = async () => {
    console.log('🎯 deductCredit called! Current credits:', credits, 'User:', user ? 'authenticated' : 'guest');
    
    if (credits > 0 && user) {
      try {
        const newCredits = await authService.deductCredits(1);
        setCredits(newCredits);
        console.log('✅ PostgreSQL credits updated:', newCredits);
      } catch (error) {
        console.error('❌ Failed to deduct credit:', error);
        alert('Failed to deduct credit. Please try again.');
      }
    } else if (!user) {
      console.log('❌ No authenticated user - cannot deduct credit');
      alert('Please log in to use credits');
      setIsLoginModalOpen(true);
    } else {
      console.log('❌ No credits available to deduct');
      alert('No credits available. Please purchase more credits.');
    }
  };

  const handleOpenLoginModal = () => setIsLoginModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);
  const handleCreditsUpdate = (newCredits) => setCredits(newCredits);

  const handleOpenContactModal = () => setIsContactModalOpen(true);
  const handleCloseContactModal = () => setIsContactModalOpen(false);

  const handleSignOut = () => {
    authService.signOut();
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
