// Mock data for testing
const mockImageBuffer = Buffer.from('fake-image-data');

const mockFluxApiResponse = {
  polling_url: 'https://api.bfl.ai/v1/status/test-id'
};

const mockFluxApiSuccess = {
  status: 'Ready',
  result: {
    sample: 'https://example.com/generated-image.jpg'
  }
};

const mockImageResponse = {
  data: mockImageBuffer
};

const mockPaymentData = {
  userId: 'test-user-123',
  productId: 'prod_basic_8_credits'
};

const mockPaymentCallback = {
  'WFP-prod_basic_8_credits-test-user-123-1234567890;Approved;1400;UAH;test-signature': ''
};

const mockFirestoreUser = {
  credits: 10,
  email: 'test@example.com'
};

module.exports = {
  mockImageBuffer,
  mockFluxApiResponse,
  mockFluxApiSuccess,
  mockImageResponse,
  mockPaymentData,
  mockPaymentCallback,
  mockFirestoreUser
};