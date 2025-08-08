// Simple API utilities
import { API_BASE_URL } from './constants';

export const api = {
  // Transform image
  async transformImage(imageFile, roomType, furnitureStyle) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('roomType', roomType);
    formData.append('furnitureStyle', furnitureStyle);

    const response = await fetch(`${API_BASE_URL}/transform`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Transform failed');
    }

    return response.blob();
  },

  // Create payment
  async createPayment(userId, productId) {
    const response = await fetch(`${API_BASE_URL}/api/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment creation failed');
    }

    return response.json();
  },

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
};