import React from 'react';
import './Footer.css';
import { useTranslation } from 'react-i18next';

const Footer = ({ onContactsClick }) => {
  const { t, i18n } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="copyright">
          © NeuroDécor 2025 • All rights reserved
        </div>
        <nav className="footer-nav">
          <a href={`/${i18n.language}/privacy`}>{t('privacy_policy')}</a>
          <a href={`/${i18n.language}/terms`}>{t('terms_of_service')}</a>
          <a href={`/${i18n.language}/terms#payments-and-subscriptions`}>{t('refund_conditions')}</a>
          <a href={`/${i18n.language}/sitemap`}>{t('sitemap')}</a>
          <button className="footer-nav-button" onClick={onContactsClick}>{t('our_contacts')}</button>
        </nav>
        <div className="made-with">
          Made with ♡ by the NeuroDécor Team
        </div>
      </div>
    </footer>
  );
};

export default Footer;