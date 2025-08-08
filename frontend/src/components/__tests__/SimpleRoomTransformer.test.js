import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimpleRoomTransformer from '../SimpleRoomTransformer';
import { api } from '../../utils/api';
import { helpers } from '../../utils/helpers';

// Mock the utilities
jest.mock('../../utils/api');
jest.mock('../../utils/helpers');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'upload_image_title': 'Upload Image',
        'drag_drop_or_click': 'Drag and drop or click to upload',
        'room_type': 'Room Type',
        'furniture_style': 'Furniture Style',
        'processing': 'Processing...',
        'transform_button': 'Transform',
        'credits': 'credits',
        'transformed_result': 'Transformed Result',
        'original': 'Original',
        'transformed': 'Transformed'
      };
      return translations[key] || key;
    }
  })
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = jest.fn();

describe('SimpleRoomTransformer Component', () => {
  const mockProps = {
    credits: 10,
    deductCredit: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    helpers.validateFile.mockReturnValue({ valid: true });
    helpers.createImageUrl.mockReturnValue('mocked-image-url');
    helpers.revokeImageUrl.mockImplementation(() => {});
  });

  test('renders upload section', () => {
    render(<SimpleRoomTransformer {...mockProps} />);
    
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop or click to upload')).toBeInTheDocument();
  });

  test('renders room type and style selects', () => {
    render(<SimpleRoomTransformer {...mockProps} />);
    
    expect(screen.getByLabelText('Room Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Furniture Style')).toBeInTheDocument();
  });

  test('renders transform button with credits info', () => {
    render(<SimpleRoomTransformer {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /transform/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Transform (10 credits)');
  });

  test('disables transform button when no credits', () => {
    render(<SimpleRoomTransformer {...mockProps} credits={0} />);
    
    const button = screen.getByRole('button', { name: /transform/i });
    expect(button).toBeDisabled();
  });

  test('disables transform button when no image selected', () => {
    render(<SimpleRoomTransformer {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /transform/i });
    expect(button).toBeDisabled();
  });

  test('handles file upload', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<SimpleRoomTransformer {...mockProps} />);
    
    const input = screen.getByRole('button', { name: /drag and drop/i });
    const hiddenInput = document.querySelector('input[type="file"]');
    
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    expect(helpers.validateFile).toHaveBeenCalledWith(file);
    expect(helpers.createImageUrl).toHaveBeenCalledWith(file);
  });

  test('shows error message for invalid file', async () => {
    helpers.validateFile.mockReturnValue({
      valid: false,
      error: 'Invalid file type'
    });
    
    const file = new File(['test'], 'test.gif', { type: 'image/gif' });
    
    render(<SimpleRoomTransformer {...mockProps} />);
    
    const hiddenInput = document.querySelector('input[type="file"]');
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    expect(screen.getByText('Invalid file type')).toBeInTheDocument();
  });

  test('handles room type selection', () => {
    render(<SimpleRoomTransformer {...mockProps} />);
    
    const select = screen.getByLabelText('Room Type');
    fireEvent.change(select, { target: { value: 'kitchen' } });
    
    expect(select.value).toBe('kitchen');
  });

  test('handles furniture style selection', () => {
    render(<SimpleRoomTransformer {...mockProps} />);
    
    const select = screen.getByLabelText('Furniture Style');
    fireEvent.change(select, { target: { value: 'modern' } });
    
    expect(select.value).toBe('modern');
  });

  test('handles successful transformation', async () => {
    const mockBlob = new Blob(['transformed image'], { type: 'image/png' });
    api.transformImage.mockResolvedValue(mockBlob);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<SimpleRoomTransformer {...mockProps} />);
    
    // Upload file
    const hiddenInput = document.querySelector('input[type="file"]');
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    // Click transform
    const button = screen.getByRole('button', { name: /transform/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(api.transformImage).toHaveBeenCalledWith(file, 'bedroom', 'scandinavian');
      expect(mockProps.deductCredit).toHaveBeenCalled();
    });
  });

  test('handles transformation error', async () => {
    api.transformImage.mockRejectedValue(new Error('Transform failed'));
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<SimpleRoomTransformer {...mockProps} />);
    
    // Upload file
    const hiddenInput = document.querySelector('input[type="file"]');
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    // Click transform
    const button = screen.getByRole('button', { name: /transform/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Transform failed')).toBeInTheDocument();
    });
  });

  test('shows loading state during transformation', async () => {
    // Create a promise that we can control
    let resolveTransform;
    const transformPromise = new Promise(resolve => {
      resolveTransform = resolve;
    });
    api.transformImage.mockReturnValue(transformPromise);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<SimpleRoomTransformer {...mockProps} />);
    
    // Upload file
    const hiddenInput = document.querySelector('input[type="file"]');
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    // Click transform
    const button = screen.getByRole('button', { name: /transform/i });
    fireEvent.click(button);
    
    // Check loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(button).toBeDisabled();
    
    // Resolve the promise
    resolveTransform(new Blob(['test'], { type: 'image/png' }));
    
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });
});