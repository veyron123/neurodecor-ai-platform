import React from 'react';
import './Sitemap.css';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Sitemap = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const links = [
    { to: `/${currentLang}`, label: t('home_design_ai') },
    { to: `/${currentLang}/terms`, label: t('terms_of_service') },
    { to: `/${currentLang}/privacy`, label: t('privacy_policy') },
  ];

  return (
    <div className="sitemap-container">
      <h1>{t('sitemap')}</h1>
      <ul>
        {links.map((link, index) => (
          <li key={index}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sitemap;