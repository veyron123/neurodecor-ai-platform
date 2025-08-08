// Simple helper functions
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from './constants';

export const helpers = {
  // Validate file upload
  validateFile(file) {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only JPG and PNG files allowed' };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large (10MB max)' };
    }
    
    return { valid: true };
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Create image URL from blob
  createImageUrl(blob) {
    return URL.createObjectURL(blob);
  },

  // Clean up image URL
  revokeImageUrl(url) {
    if (url) URL.revokeObjectURL(url);
  },

  // Simple debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};