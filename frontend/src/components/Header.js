import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Header.css';
import { useTranslation } from 'react-i18next';

const Header = ({ user, onLoginClick, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const langMenuRef = useRef(null);

  const handleLangChange = (newLang) => {
    i18n.changeLanguage(newLang);
    navigate(`/${newLang}`);
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo">
          <Link to={`/${lang || 'en'}`} className="logo-link">
            <span className="logo-icon">🏠</span> NeuroDécor
          </Link>
        </div>
        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          &#9776;
        </button>
        <div className={`header-center ${isMenuOpen ? 'active' : ''}`}>
          <nav className="main-nav">
            <a href={`/${lang || 'en'}#gallery`}>{t('gallery')}</a>
            <a href={`/${lang || 'en'}#pricing`}>{t('pricing')}</a>
            <a href={`/${lang || 'en'}#faq`}>{t('faq')}</a>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <Link to={`/${lang || 'en'}/dashboard`} className="login-btn">{t('dashboard')}</Link>
                <button onClick={onSignOut} className="start-staging-btn">{t('logout')}</button>
              </>
            ) : (
              <>
                <button onClick={onLoginClick} className="login-btn">{t('login')}</button>
                <a href={`/${lang || 'en'}#pricing`} className="start-staging-btn">{t('start_staging')}</a>
              </>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="language-switcher" ref={langMenuRef}>
          <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="language-switcher-button">
            {t('language')} <span className="arrow-down"></span>
          </button>
          {isLangMenuOpen && (
            <div className="language-switcher-dropdown">
              <button onClick={() => handleLangChange('en')} className={lang === 'en' ? 'active' : ''}>{t('english')}</button>
              <button onClick={() => handleLangChange('uk')} className={lang === 'uk' ? 'active' : ''}>{t('ukrainian')}</button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;