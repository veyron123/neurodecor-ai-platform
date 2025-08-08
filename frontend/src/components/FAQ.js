import React from 'react';
import './FAQ.css';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();

  const faqData = [
    {
      question: t('faq1_question'),
      answer: t('faq1_answer')
    },
    {
      question: t('faq2_question'),
      answer: t('faq2_answer')
    },
    {
      question: t('faq3_question'),
      answer: t('faq3_answer')
    },
    {
      question: t('faq4_question'),
      answer: t('faq4_answer')
    },
    {
      question: t('faq5_question'),
      answer: t('faq5_answer')
    },
    {
      question: t('faq6_question'),
      answer: t('faq6_answer')
    }
  ];

  return (
    <div id="faq" className="faq-section">
      <h2>{t('faq_title')}</h2>
      <p className="section-subtitle">{t('faq_subtitle')}</p>
      <div className="faq-grid">
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <div className="faq-question">
              <span className="question-icon">?</span>
              <h3>{item.question}</h3>
            </div>
            <p className="faq-answer">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;