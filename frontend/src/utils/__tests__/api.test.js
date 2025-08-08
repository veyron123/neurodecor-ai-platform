import { api } from '../api';

// Mock fetch
global.fetch = jest.fn();

describe('API Tests', () => {

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('transformImage', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const roomType = 'bedroom';
    const furnitureStyle = 'scandinavian';

    test('should make POST request with correct data', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      await api.transformImage(mockFile, roomType, furnitureStyle);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/transform', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    test('should return blob on success', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      const result = await api.transformImage(mockFile, roomType, furnitureStyle);
      expect(result).toBe(mockBlob);
    });

    test('should throw error on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Transform failed' })
      });

      await expect(api.transformImage(mockFile, roomType, furnitureStyle))
        .rejects.toThrow('Transform failed');
    });

    test('should throw default error when no error message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      });

      await expect(api.transformImage(mockFile, roomType, furnitureStyle))
        .rejects.toThrow('Transform failed');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.transformImage(mockFile, roomType, furnitureStyle))
        .rejects.toThrow('Network error');
    });
  });

  describe('createPayment', () => {
    const userId = 'test-user-123';
    const productId = 'prod_basic_8_credits';

    test('should make POST request with correct data', async () => {
      const mockResponse = { orderReference: 'test-order-ref' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await api.createPayment(userId, productId);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      });
    });

    test('should return payment data on success', async () => {
      const mockResponse = { orderReference: 'test-order-ref' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.createPayment(userId, productId);
      expect(result).toEqual(mockResponse);
    });

    test('should throw error on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Payment creation failed' })
      });

      await expect(api.createPayment(userId, productId))
        .rejects.toThrow('Payment creation failed');
    });
  });

  describe('healthCheck', () => {
    test('should make GET request to health endpoint', async () => {
      const mockHealth = { status: 'OK', hasFlux: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealth)
      });

      await api.healthCheck();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/health');
    });

    test('should return health data', async () => {
      const mockHealth = { status: 'OK', hasFlux: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealth)
      });

      const result = await api.healthCheck();
      expect(result).toEqual(mockHealth);
    });

    test('should handle health check errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Health check failed'));

      await expect(api.healthCheck()).rejects.toThrow('Health check failed');
    });
  });
});