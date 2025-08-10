import React, { useState } from 'react';
import './Pricing.css';
import { useTranslation } from 'react-i18next';
import { products } from '../pricingData'; // Импортируем напрямую продукты
import { auth } from '../firebase';
import axios from 'axios';
import { demoPaymentSystem } from '../utils/demo-payment';

const Pricing = ({ onSubscribeClick }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(null); // Будем хранить ID загружаемого плана

  const handlePurchase = async (product) => {
    const user = auth.currentUser;
    if (!user) {
      if (onSubscribeClick) onSubscribeClick();
      return;
    }

    setIsLoading(product.id);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3007'}/api/create-payment`, {
        userId: user.uid,
        productId: product.id,
      });

      const paymentData = response.data;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://secure.wayforpay.com/pay';
      form.acceptCharset = 'utf-8';

      Object.keys(paymentData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = Array.isArray(paymentData[key]) ? paymentData[key].join(';') : paymentData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error('Payment API not available, using demo system:', error);
      
      // Use demo payment system when API is not available
      try {
        const result = await demoPaymentSystem.simulatePayment(product.id);
        if (result.success) {
          alert(`✅ Демо-платеж успешен! Начислено ${result.creditsAdded} кредитов. 
          
🔄 Обновите страницу чтобы увидеть новый баланс.

ℹ️ Это демо-режим пока настраивается Firebase API.`);
          // Reload to refresh credits
          window.location.reload();
        }
      } catch (demoError) {
        alert('Ошибка демо-платежа. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div id="pricing" className="pricing-section">
      <h2>{t('pricing_title')}</h2>
      <p className="section-subtitle" dangerouslySetInnerHTML={{ __html: t('pricing_subtitle').replace('\\n', '<br />') }} />
      
      <div className="pricing-grid">
        {products.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.id === 'prod_standard_20_credits' ? 'featured' : ''}`}>
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">
              {plan.price} грн <span className="plan-period">{plan.id === 'prod_basic_10_credits' ? '/разовий платіж' : '/місяць'}</span>
            </div>
            <div className="plan-photos">{plan.credits} кредитов</div>
            <ul className="plan-features">
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <span className="tick-icon">✓</span> {feature}
                </li>
              ))}
            </ul>
            <button 
              className="cta-button" 
              onClick={() => handlePurchase(plan)}
              disabled={isLoading === plan.id}
            >
              {isLoading === plan.id ? 'Загрузка...' : (plan.id === 'prod_basic_10_credits' ? 'Сплатити зараз' : 'Підписатися зараз')}
            </button>
            <p className="refund-text">{t('refund_text')}</p>
          </div>
        ))}
      </div>
      <div className="cta-section">
        <p className="trusted-by-text">{t('trusted_by')}</p>
        <img src="/real_estate_logos.png" alt="Client logos" className="client-logos" />
      </div>
    </div>
  );
};

export default Pricing;