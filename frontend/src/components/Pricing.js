import React, { useState } from 'react';
import './Pricing.css';
import { useTranslation } from 'react-i18next';
import { products } from '../pricingData'; // Импортируем напрямую продукты
import { authService } from '../auth/authService';
import axios from 'axios';

const Pricing = ({ onSubscribeClick, onCreditsUpdate }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(null); // Будем хранить ID загружаемого плана

  const handlePurchase = async (product) => {
    const user = authService.getCurrentUser();
    
    // PRODUCTION MODE: Real payments only, require authentication
    if (user) {
      await handleRealPayment(user, product);
    } else {
      // Require login for real payments
      alert('Пожалуйста, войдите в систему для покупки кредитов');
      onSubscribeClick(); // Open login modal
    }
  };

  const handleRealPayment = async (user, product) => {
    setIsLoading(product.id);
    try {
      // Get auth token for authenticated request
      const token = authService.getToken();
      console.log('🔐 Making payment request with token:', token ? 'present' : 'missing');
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'https://neurodecor-backend.onrender.com'}/api/create-payment`, {
        userId: user.id,
        productId: product.id,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      console.error('❌ PRODUCTION ERROR: Payment failed:', error);
      alert('❌ Ошибка платежа. Проверьте соединение и попробуйте снова. Если проблема повторяется, обратитесь в поддержку.');
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