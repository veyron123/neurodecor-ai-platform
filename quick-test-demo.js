// Quick test of demo payment system
const { demoPaymentSystem } = require('./frontend/src/utils/demo-payment.js');

async function testDemo() {
  console.log('🧪 Testing Demo Payment System...\n');
  
  // Check initial credits
  let credits = demoPaymentSystem.getDemoCredits();
  console.log('📊 Initial credits:', credits);
  
  // Simulate basic package purchase
  console.log('💳 Simulating basic package purchase (10 credits)...');
  const result = await demoPaymentSystem.simulatePayment('prod_basic_10_credits');
  
  if (result.success) {
    console.log('✅ Payment successful!');
    console.log('📈 Credits added:', result.creditsAdded);
    console.log('💰 Total credits:', result.totalCredits);
  } else {
    console.log('❌ Payment failed:', result.error);
  }
  
  // Test credit usage
  console.log('\n🎨 Testing image generation (1 credit)...');
  if (demoPaymentSystem.useCredit()) {
    console.log('✅ Credit deducted successfully!');
    console.log('💰 Remaining credits:', demoPaymentSystem.getDemoCredits());
  } else {
    console.log('❌ No credits available for generation');
  }
  
  console.log('\n🎉 Demo system test completed!');
  console.log('👉 Now test in browser: http://localhost:3000');
}

testDemo();