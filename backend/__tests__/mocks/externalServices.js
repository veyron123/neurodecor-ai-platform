// Mock for WayForPay API
const mockWayForPayCallback = (status = 'Approved', orderReference = 'TEST-ORDER-123') => ({
  merchantAccount: 'test_merchant',
  orderReference,
  merchantSignature: 'test_signature',
  amount: 1,
  currency: 'UAH',
  authCode: '123456',
  email: 'test@example.com',
  phone: '380123456789',
  createdDate: Math.floor(Date.now() / 1000),
  processingDate: Math.floor(Date.now() / 1000),
  cardPan: '47****1234',
  cardType: 'Visa',
  transactionStatus: status,
  reason: status === 'Approved' ? 'Ok' : 'Declined',
  reasonCode: status === 'Approved' ? 1100 : 1101
});

// Mock for Flux AI API
const mockFluxAPI = {
  success: () => ({
    data: {
      polling_url: 'https://api.bfl.ai/v1/get_result?id=test-123'
    }
  }),
  pollingSuccess: () => ({
    data: {
      status: 'Ready',
      result: {
        sample: 'https://test-image-url.com/result.jpg'
      }
    }
  }),
  pollingPending: () => ({
    data: {
      status: 'Task is in progress'
    }
  }),
  pollingFailed: () => ({
    data: {
      status: 'Error',
      error: 'Generation failed'
    }
  }),
  imageData: Buffer.from('fake-image-data')
};

// Mock for Google OAuth API
const mockGoogleAuth = {
  validToken: {
    getPayload: () => ({
      sub: 'google_user_123',
      email: 'testuser@gmail.com',
      name: 'Test User',
      picture: 'https://lh3.googleusercontent.com/test'
    })
  },
  invalidToken: () => {
    throw new Error('Invalid token signature');
  }
};

// Mock axios for external API calls
const createAxiosMock = (scenario = 'success') => {
  const axios = {
    post: jest.fn(),
    get: jest.fn()
  };

  switch (scenario) {
    case 'flux-success':
      axios.post.mockResolvedValueOnce(mockFluxAPI.success());
      axios.get
        .mockResolvedValueOnce(mockFluxAPI.pollingPending())
        .mockResolvedValueOnce(mockFluxAPI.pollingSuccess());
      axios.get.mockResolvedValueOnce({ data: mockFluxAPI.imageData });
      break;
      
    case 'flux-timeout':
      axios.post.mockResolvedValueOnce(mockFluxAPI.success());
      axios.get.mockResolvedValue(mockFluxAPI.pollingPending());
      break;
      
    case 'flux-failed':
      axios.post.mockResolvedValueOnce(mockFluxAPI.success());
      axios.get.mockResolvedValueOnce(mockFluxAPI.pollingFailed());
      break;
      
    case 'network-error':
      axios.post.mockRejectedValue(new Error('Network Error'));
      break;
      
    default:
      axios.post.mockResolvedValue({ data: {} });
      axios.get.mockResolvedValue({ data: {} });
  }
  
  return axios;
};

// Mock Google OAuth Client
const createGoogleClientMock = (scenario = 'valid') => {
  const client = {
    verifyIdToken: jest.fn()
  };

  switch (scenario) {
    case 'valid':
      client.verifyIdToken.mockResolvedValue(mockGoogleAuth.validToken);
      break;
    case 'invalid':
      client.verifyIdToken.mockRejectedValue(mockGoogleAuth.invalidToken());
      break;
    default:
      client.verifyIdToken.mockResolvedValue(mockGoogleAuth.validToken);
  }
  
  return client;
};

// Mock multer file upload
const createMockFile = (filename = 'test.jpg', mimetype = 'image/jpeg') => ({
  fieldname: 'image',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  destination: 'uploads/',
  filename: `test-${Date.now()}-${filename}`,
  path: `uploads/test-${Date.now()}-${filename}`,
  size: 1024
});

// Mock crypto for signature generation
const createCryptoMock = () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'test_signature_hash')
    }))
  }))
});

module.exports = {
  mockWayForPayCallback,
  mockFluxAPI,
  mockGoogleAuth,
  createAxiosMock,
  createGoogleClientMock,
  createMockFile,
  createCryptoMock
};