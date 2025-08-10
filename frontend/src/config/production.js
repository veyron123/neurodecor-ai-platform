// Production configuration
export const PRODUCTION_CONFIG = {
  // Disable demo mode in production
  DEMO_MODE: false,
  
  // Payment system configuration
  PAYMENT_SYSTEM: 'WayForPay',
  
  // Require authentication for all features
  REQUIRE_AUTH: true,
  
  // Credit system settings
  CREDIT_SYSTEM: {
    provider: 'Firebase',
    fallback: 'demo', // Only as emergency fallback
    minCredits: 0,
    showBalance: true
  },
  
  // API endpoints
  API: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3007',
    paymentEndpoint: '/api/create-payment',
    callbackEndpoint: '/api/payment-callback'
  },
  
  // Feature flags
  FEATURES: {
    demoPayments: false,
    realPayments: true,
    guestMode: false,  // Require login for all operations
    freeCredits: false // No free credits in production
  },
  
  // UI Messages
  MESSAGES: {
    noCredits: 'У вас недостаточно кредитов. Пожалуйста, купите больше кредитов.',
    requireLogin: 'Пожалуйста, войдите в систему для покупки и использования кредитов',
    paymentError: 'Ошибка платежа. Проверьте соединение и попробуйте снова.',
    productionMode: 'PRODUCTION MODE'
  }
};

export default PRODUCTION_CONFIG;