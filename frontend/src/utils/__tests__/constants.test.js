import { 
  API_BASE_URL, 
  ROOM_TYPES, 
  FURNITURE_STYLES, 
  SUPPORTED_FILE_TYPES, 
  MAX_FILE_SIZE 
} from '../constants';

describe('Constants Tests', () => {
  
  describe('API_BASE_URL', () => {
    test('should be defined', () => {
      expect(API_BASE_URL).toBeDefined();
    });

    test('should be a valid URL format', () => {
      expect(API_BASE_URL).toMatch(/^https?:\/\//);
    });

    test('should point to localhost:3001', () => {
      expect(API_BASE_URL).toBe('http://localhost:3001');
    });
  });

  describe('ROOM_TYPES', () => {
    test('should be defined and be an object', () => {
      expect(ROOM_TYPES).toBeDefined();
      expect(typeof ROOM_TYPES).toBe('object');
    });

    test('should contain expected room types', () => {
      const expectedRooms = ['bedroom', 'living-room', 'kitchen', 'dining-room', 'bathroom', 'home-office'];
      expectedRooms.forEach(room => {
        expect(ROOM_TYPES).toHaveProperty(room);
      });
    });

    test('should have string values', () => {
      Object.values(ROOM_TYPES).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('should have 6 room types', () => {
      expect(Object.keys(ROOM_TYPES)).toHaveLength(6);
    });
  });

  describe('FURNITURE_STYLES', () => {
    test('should be defined and be an object', () => {
      expect(FURNITURE_STYLES).toBeDefined();
      expect(typeof FURNITURE_STYLES).toBe('object');
    });

    test('should contain expected furniture styles', () => {
      const expectedStyles = ['scandinavian', 'modern', 'minimalist', 'coastal', 'industrial', 'traditional'];
      expectedStyles.forEach(style => {
        expect(FURNITURE_STYLES).toHaveProperty(style);
      });
    });

    test('should have string values', () => {
      Object.values(FURNITURE_STYLES).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('should have 6 furniture styles', () => {
      expect(Object.keys(FURNITURE_STYLES)).toHaveLength(6);
    });
  });

  describe('SUPPORTED_FILE_TYPES', () => {
    test('should be defined and be an array', () => {
      expect(SUPPORTED_FILE_TYPES).toBeDefined();
      expect(Array.isArray(SUPPORTED_FILE_TYPES)).toBe(true);
    });

    test('should contain jpeg and png types', () => {
      expect(SUPPORTED_FILE_TYPES).toContain('image/jpeg');
      expect(SUPPORTED_FILE_TYPES).toContain('image/png');
    });

    test('should have exactly 2 file types', () => {
      expect(SUPPORTED_FILE_TYPES).toHaveLength(2);
    });
  });

  describe('MAX_FILE_SIZE', () => {
    test('should be defined and be a number', () => {
      expect(MAX_FILE_SIZE).toBeDefined();
      expect(typeof MAX_FILE_SIZE).toBe('number');
    });

    test('should be 10MB', () => {
      const expectedSize = 10 * 1024 * 1024;
      expect(MAX_FILE_SIZE).toBe(expectedSize);
    });

    test('should be greater than 0', () => {
      expect(MAX_FILE_SIZE).toBeGreaterThan(0);
    });
  });
});