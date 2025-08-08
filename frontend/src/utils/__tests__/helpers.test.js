import { helpers } from '../helpers';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('Helpers Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    test('should return valid for correct JPEG file', () => {
      const file = { type: 'image/jpeg', size: 1024 * 1024 }; // 1MB
      const result = helpers.validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should return valid for correct PNG file', () => {
      const file = { type: 'image/png', size: 2 * 1024 * 1024 }; // 2MB
      const result = helpers.validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should return invalid for no file', () => {
      const result = helpers.validateFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file selected');
    });

    test('should return invalid for unsupported file type', () => {
      const file = { type: 'image/gif', size: 1024 * 1024 };
      const result = helpers.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only JPG and PNG files allowed');
    });

    test('should return invalid for oversized file', () => {
      const file = { type: 'image/jpeg', size: 20 * 1024 * 1024 }; // 20MB
      const result = helpers.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File too large (10MB max)');
    });
  });

  describe('formatFileSize', () => {
    test('should format 0 bytes', () => {
      expect(helpers.formatFileSize(0)).toBe('0 B');
    });

    test('should format bytes', () => {
      expect(helpers.formatFileSize(512)).toBe('512 B');
    });

    test('should format kilobytes', () => {
      expect(helpers.formatFileSize(1024)).toBe('1 KB');
      expect(helpers.formatFileSize(1536)).toBe('1.5 KB');
    });

    test('should format megabytes', () => {
      expect(helpers.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(helpers.formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    test('should handle large numbers', () => {
      expect(helpers.formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
    });
  });

  describe('createImageUrl', () => {
    test('should call URL.createObjectURL with blob', () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      helpers.createImageUrl(mockBlob);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });

  describe('revokeImageUrl', () => {
    test('should call URL.revokeObjectURL with url', () => {
      const url = 'blob:http://localhost:3000/test';
      helpers.revokeImageUrl(url);
      
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    });

    test('should not call URL.revokeObjectURL if no url', () => {
      helpers.revokeImageUrl(null);
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();

      helpers.revokeImageUrl(undefined);
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = helpers.debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should cancel previous call if called again', () => {
      const mockFn = jest.fn();
      const debouncedFn = helpers.debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = helpers.debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});