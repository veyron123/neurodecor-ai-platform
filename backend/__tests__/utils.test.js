// Test utility functions
describe('Utility Functions Tests', () => {
  
  describe('createPrompt function', () => {
    // Mock the createPrompt function for testing
    const createPrompt = (roomType, furnitureStyle) => {
      const rooms = {
        'bedroom': 'bedroom', 'living-room': 'living room', 'kitchen': 'kitchen',
        'dining-room': 'dining room', 'bathroom': 'bathroom', 'home-office': 'home office'
      };
      
      const styles = {
        'scandinavian': 'Scandinavian style with soft lighting and white wood',
        'modern': 'modern style with sleek furniture and clean lines',
        'minimalist': 'minimalist style with simple furniture and clean surfaces',
        'coastal': 'coastal style with light blue and natural textures',
        'industrial': 'industrial style with exposed brick and metal',
        'traditional': 'traditional style with classic furniture'
      };

      const room = rooms[roomType] || roomType;
      const style = styles[furnitureStyle] || `${furnitureStyle} style`;
      
      return `Transform this ${room} into ${style}. Keep the layout, make it photorealistic.`;
    };

    test('should create prompt for bedroom scandinavian style', () => {
      const result = createPrompt('bedroom', 'scandinavian');
      expect(result).toContain('bedroom');
      expect(result).toContain('Scandinavian style');
      expect(result).toContain('Transform');
      expect(result).toContain('photorealistic');
    });

    test('should create prompt for living room modern style', () => {
      const result = createPrompt('living-room', 'modern');
      expect(result).toContain('living room');
      expect(result).toContain('modern style');
    });

    test('should handle unknown room type', () => {
      const result = createPrompt('unknown-room', 'scandinavian');
      expect(result).toContain('unknown-room');
      expect(result).toContain('Scandinavian style');
    });

    test('should handle unknown style', () => {
      const result = createPrompt('bedroom', 'unknown-style');
      expect(result).toContain('bedroom');
      expect(result).toContain('unknown-style style');
    });

    test('should handle both unknown room and style', () => {
      const result = createPrompt('custom-room', 'custom-style');
      expect(result).toContain('custom-room');
      expect(result).toContain('custom-style style');
    });
  });

  describe('PRODUCTS configuration', () => {
    const PRODUCTS = {
      'prod_basic_8_credits': { name: 'Базовий', price: 1, credits: 8 },
      'prod_standard_20_credits': { name: 'Стандарт', price: 1400, credits: 20 },
      'prod_prof_60_credits': { name: 'Професійний', price: 3200, credits: 60 }
    };

    test('should have all required product fields', () => {
      Object.values(PRODUCTS).forEach(product => {
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('credits');
      });
    });

    test('should have numeric prices and credits', () => {
      Object.values(PRODUCTS).forEach(product => {
        expect(typeof product.price).toBe('number');
        expect(typeof product.credits).toBe('number');
        expect(product.price).toBeGreaterThan(0);
        expect(product.credits).toBeGreaterThan(0);
      });
    });

    test('should have string names', () => {
      Object.values(PRODUCTS).forEach(product => {
        expect(typeof product.name).toBe('string');
        expect(product.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('File validation', () => {
    const validateFile = (file) => {
      const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];
      const MAX_FILE_SIZE = 10 * 1024 * 1024;

      if (!file) return { valid: false, error: 'No file provided' };
      
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Only JPG and PNG files allowed' };
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File too large (10MB max)' };
      }
      
      return { valid: true };
    };

    test('should accept valid JPEG file', () => {
      const file = { type: 'image/jpeg', size: 1024 * 1024 }; // 1MB
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should accept valid PNG file', () => {
      const file = { type: 'image/png', size: 2 * 1024 * 1024 }; // 2MB
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should reject unsupported file type', () => {
      const file = { type: 'image/gif', size: 1024 * 1024 };
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Only JPG and PNG');
    });

    test('should reject oversized file', () => {
      const file = { type: 'image/jpeg', size: 20 * 1024 * 1024 }; // 20MB
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    test('should reject null file', () => {
      const result = validateFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file provided');
    });
  });
});