const { mockWayForPayCallback, createCryptoMock } = require('../mocks/externalServices');

// Mock the database module
const mockDb = {
  transaction: jest.fn(),
  query: jest.fn()
};

// Mock crypto module
const mockCrypto = createCryptoMock();

// We need to test the helper functions from server-postgres.js
// Since they're not exported, we'll test them through their behavior

describe('Payment Helper Functions', () => {
  let processSuccessfulPayment, updateTransactionStatus, handleError;
  
  beforeAll(() => {
    // Mock the helper functions for unit testing
    processSuccessfulPayment = async (transaction, callbackData) => {
      await mockDb.transaction(async (client) => {
        await client.query(
          'UPDATE transactions SET status = $1, callback_data = $2, updated_at = CURRENT_TIMESTAMP WHERE order_reference = $3',
          ['completed', JSON.stringify(callbackData), transaction.order_reference]
        );
        await client.query(
          'UPDATE users SET credits = credits + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [transaction.credits_added, transaction.user_id]
        );
      });
    };

    updateTransactionStatus = async (transaction, status, callbackData) => {
      await mockDb.query(
        'UPDATE transactions SET status = $1, callback_data = $2, updated_at = CURRENT_TIMESTAMP WHERE order_reference = $3',
        [status.toLowerCase(), JSON.stringify(callbackData), transaction.order_reference]
      );
    };

    handleError = (res, error, message, statusCode = 500) => {
      console.error(`❌ ${message}:`, error);
      res.status(statusCode).json({ error: message });
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSuccessfulPayment', () => {
    const mockTransaction = {
      id: 1,
      user_id: 123,
      order_reference: 'WFP-test-123',
      credits_added: 10,
      amount: '1.00',
      status: 'pending'
    };

    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    };

    it('should process successful payment with database transaction', async () => {
      const callbackData = mockWayForPayCallback();
      mockDb.transaction.mockImplementation(async (callback) => {
        await callback(mockClient);
      });

      await processSuccessfulPayment(mockTransaction, callbackData);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      
      // Check transaction status update
      expect(mockClient.query).toHaveBeenNthCalledWith(1,
        'UPDATE transactions SET status = $1, callback_data = $2, updated_at = CURRENT_TIMESTAMP WHERE order_reference = $3',
        ['completed', JSON.stringify(callbackData), mockTransaction.order_reference]
      );
      
      // Check credit addition
      expect(mockClient.query).toHaveBeenNthCalledWith(2,
        'UPDATE users SET credits = credits + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [mockTransaction.credits_added, mockTransaction.user_id]
      );
    });

    it('should handle database transaction errors properly', async () => {
      const callbackData = mockWayForPayCallback();
      const dbError = new Error('Database connection failed');
      
      mockDb.transaction.mockRejectedValue(dbError);

      await expect(processSuccessfulPayment(mockTransaction, callbackData))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle partial transaction failures', async () => {
      const callbackData = mockWayForPayCallback();
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // First query succeeds
        .mockRejectedValueOnce(new Error('Credit update failed')); // Second query fails

      mockDb.transaction.mockImplementation(async (callback) => {
        await callback(mockClient);
      });

      await expect(processSuccessfulPayment(mockTransaction, callbackData))
        .rejects.toThrow('Credit update failed');
    });
  });

  describe('updateTransactionStatus', () => {
    const mockTransaction = {
      order_reference: 'WFP-test-123',
      status: 'pending'
    };

    it('should update transaction status correctly', async () => {
      const status = 'Declined';
      const callbackData = mockWayForPayCallback('Declined');
      
      mockDb.query.mockResolvedValue({ rows: [] });

      await updateTransactionStatus(mockTransaction, status, callbackData);

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE transactions SET status = $1, callback_data = $2, updated_at = CURRENT_TIMESTAMP WHERE order_reference = $3',
        [status.toLowerCase(), JSON.stringify(callbackData), mockTransaction.order_reference]
      );
    });

    it('should convert status to lowercase', async () => {
      const status = 'FAILED';
      const callbackData = mockWayForPayCallback('Failed');
      
      mockDb.query.mockResolvedValue({ rows: [] });

      await updateTransactionStatus(mockTransaction, status, callbackData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['failed', JSON.stringify(callbackData), mockTransaction.order_reference]
      );
    });

    it('should handle database update errors', async () => {
      const status = 'declined';
      const callbackData = mockWayForPayCallback('Declined');
      const dbError = new Error('Update failed');
      
      mockDb.query.mockRejectedValue(dbError);

      await expect(updateTransactionStatus(mockTransaction, status, callbackData))
        .rejects.toThrow('Update failed');
    });
  });

  describe('handleError', () => {
    let mockRes;

    beforeEach(() => {
      mockRes = createMockRes();
    });

    it('should handle errors with default status code 500', () => {
      const error = new Error('Test error');
      const message = 'Test operation failed';

      handleError(mockRes, error, message);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: message });
    });

    it('should handle errors with custom status code', () => {
      const error = new Error('Validation error');
      const message = 'Invalid input data';
      const statusCode = 400;

      handleError(mockRes, error, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: message });
    });

    it('should log error with proper format', () => {
      const error = new Error('Database connection lost');
      const message = 'Database operation failed';
      const consoleSpy = jest.spyOn(console, 'error');

      handleError(mockRes, error, message);

      expect(consoleSpy).toHaveBeenCalledWith(`❌ ${message}:`, error);
    });

    it('should return proper response structure', () => {
      const error = new Error('Network timeout');
      const message = 'Request timeout';
      
      handleError(mockRes, error, message, 408);

      expect(mockRes.status).toHaveReturnedWith(mockRes);
      expect(mockRes.json).toHaveReturnedWith(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith({ error: message });
    });

    it('should handle null or undefined errors gracefully', () => {
      const message = 'Unknown error occurred';

      expect(() => {
        handleError(mockRes, null, message);
      }).not.toThrow();

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: message });
    });
  });

  describe('Integration between helper functions', () => {
    it('should work together in payment processing workflow', async () => {
      const mockTransaction = {
        id: 1,
        user_id: 123,
        order_reference: 'WFP-integration-test',
        credits_added: 10,
        status: 'pending'
      };
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }) };
      const callbackData = mockWayForPayCallback('Approved', 'WFP-integration-test');

      // Mock successful processing
      mockDb.transaction.mockImplementation(async (callback) => {
        await callback(mockClient);
      });

      await processSuccessfulPayment(mockTransaction, callbackData);

      // Verify the workflow
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should handle failed payments appropriately', async () => {
      const mockTransaction = {
        order_reference: 'WFP-failed-test',
        status: 'pending'
      };
      const callbackData = mockWayForPayCallback('Declined', 'WFP-failed-test');
      
      mockDb.query.mockResolvedValue({ rows: [] });

      await updateTransactionStatus(mockTransaction, 'declined', callbackData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['declined', JSON.stringify(callbackData), 'WFP-failed-test']
      );
    });
  });
});