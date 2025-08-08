import React from 'react';
import './Marketing.css';
import { useTranslation } from 'react-i18next';

const Marketing = () => {
  const { t } = useTranslation();

  const marketingData = [
    {
      icon: '/images/faster-sales.png',
      title: t('marketing_card1_title'),
      text: t('marketing_card1_text')
    },
    {
      icon: '/images/buyer-interest.png',
      title: t('marketing_card2_title'),
      text: t('marketing_card2_text')
    },
    {
      icon: '/images/higher-offers.png',
      title: t('marketing_card3_title'),
      text: t('marketing_card3_text')
    },
    {
      icon: '/images/show-dont-tell.png',
      title: t('marketing_card4_title'),
      text: t('marketing_card4_text')
    }
  ];

  return (
    <div className="marketing-section">
      <h2>{t('marketing_title')}</h2>
      <p className="section-subtitle">
        {t('marketing_subtitle')}
      </p>
      <div className="marketing-grid">
        {marketingData.map((item, index) => (
          <div key={index} className="marketing-card">
            <img src={item.icon} alt={`${item.title} icon`} className="card-icon" />
            <div className="card-content">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketing;