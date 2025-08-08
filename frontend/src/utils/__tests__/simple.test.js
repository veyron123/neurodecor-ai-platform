// Simple utility tests for coverage
import { API_BASE_URL, ROOM_TYPES, FURNITURE_STYLES } from '../constants';
import { api } from '../api';
import { helpers } from '../helpers';

describe('Simple Utility Tests', () => {
  
  test('constants are defined', () => {
    expect(API_BASE_URL).toBe('http://localhost:3001');
    expect(Object.keys(ROOM_TYPES)).toHaveLength(6);
    expect(Object.keys(FURNITURE_STYLES)).toHaveLength(6);
  });

  test('helpers work correctly', () => {
    // File validation
    expect(helpers.validateFile(null).valid).toBe(false);
    expect(helpers.validateFile({ type: 'image/jpeg', size: 1024 }).valid).toBe(true);
    
    // File size formatting
    expect(helpers.formatFileSize(0)).toBe('0 B');
    expect(helpers.formatFileSize(1024)).toBe('1 KB');
    
    // Debounce
    const debounced = helpers.debounce(jest.fn(), 100);
    expect(typeof debounced).toBe('function');
  });

  test('api functions exist', () => {
    expect(typeof api.transformImage).toBe('function');
    expect(typeof api.createPayment).toBe('function');
    expect(typeof api.healthCheck).toBe('function');
  });
});