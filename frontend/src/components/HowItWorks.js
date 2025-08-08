import React from 'react';
import './HowItWorks.css';
import { useTranslation } from 'react-i18next';

const HowItWorks = () => {
  const { t } = useTranslation();
  return (
    <div className="how-it-works-section">
      <h2>{t('how_it_works_title')}</h2>
      <p className="section-subtitle">
        {t('how_it_works_subtitle')}
      </p>
      <div className="comparison-container">
        <div className="comparison-card propstyle-card">
          <h3>{t('with_neurodecor')} <span className="propstyle-icon"></span></h3>
          <ul>
            <li>
              <strong>{t('step1_title')}</strong> (30 seconds)
              <p>{t('step1_desc')}</p>
            </li>
            <li>
              <strong>{t('step2_title')}</strong> (1 minute)
              <p>{t('step2_desc')}</p>
            </li>
            <li>
              <strong>{t('step3_title')}</strong> (30 seconds)
              <p>{t('step3_desc')}</p>
            </li>
          </ul>
        </div>
        <div className="vs-divider">VS</div>
        <div className="comparison-card traditional-card">
          <h3>{t('traditional_design')}</h3>
          <ul>
            <li><span className="cross-icon">✗</span> {t('traditional_step1')}</li>
            <li><span className="cross-icon">✗</span> {t('traditional_step2')}</li>
            <li><span className="cross-icon">✗</span> {t('traditional_step3')}</li>
            <li><span className="cross-icon">✗</span> {t('traditional_step4')}</li>
            <li><span className="cross-icon">✗</span> {t('traditional_step5')}</li>
            <li><span className="cross-icon">✗</span> {t('traditional_step6')}</li>
            <li><span className="cross-icon">✗</span> {t('traditional_step7')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;