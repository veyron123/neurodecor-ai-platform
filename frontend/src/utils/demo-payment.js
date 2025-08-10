// Demo payment system while Firebase API is being enabled
export const demoPaymentSystem = {
  // Initialize demo system
  init: () => {
    if (!localStorage.getItem('demo_credits')) {
      localStorage.setItem('demo_credits', '0');
      localStorage.setItem('demo_initialized', 'true');
      console.log('🎮 Demo payment system initialized with 0 credits');
    }
  },
  // Store demo credits in localStorage
  getDemoCredits: () => {
    return parseInt(localStorage.getItem('demo_credits') || '0');
  },

  setDemoCredits: (credits) => {
    localStorage.setItem('demo_credits', credits.toString());
  },

  // Simulate payment success
  simulatePayment: (productId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const products = {
          'prod_basic_10_credits': { credits: 10, price: 1 },
          'prod_standard_20_credits': { credits: 20, price: 1400 },
          'prod_prof_60_credits': { credits: 60, price: 3200 }
        };
        
        const product = products[productId];
        if (product) {
          const currentCredits = demoPaymentSystem.getDemoCredits();
          demoPaymentSystem.setDemoCredits(currentCredits + product.credits);
          resolve({
            success: true,
            creditsAdded: product.credits,
            totalCredits: currentCredits + product.credits
          });
        } else {
          resolve({ success: false, error: 'Unknown product' });
        }
      }, 2000); // Simulate payment processing delay
    });
  },

  // Use a credit for transformation
  useCredit: () => {
    const credits = demoPaymentSystem.getDemoCredits();
    if (credits > 0) {
      demoPaymentSystem.setDemoCredits(credits - 1);
      return true;
    }
    return false;
  },

  // Clear demo data (for switching to Firebase)
  clearDemo: () => {
    localStorage.removeItem('demo_credits');
    localStorage.removeItem('demo_initialized');
    console.log('🧹 Demo system cleared');
  },

  // Check if demo mode is active
  isDemoActive: () => {
    return demoPaymentSystem.getDemoCredits() > 0;
  }
};