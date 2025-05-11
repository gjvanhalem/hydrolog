import { render, screen, fireEvent, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import ImageUpload from '@/app/components/ImageUpload';

// Mock necessary globals for react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn().mockReturnValue({
    getRootProps: jest.fn().mockReturnValue({}),
    getInputProps: jest.fn().mockReturnValue({}),
    isDragActive: false
  }),
}));

// Mock fetch globally
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ url: '/uploads/test-image.jpg' }),
  })
) as jest.Mock;

// Mock the fetch function
global.fetch = jest.fn();

describe('ImageUpload', () => {
  const mockOnUpload = jest.fn();
  const mockFetchResponse = {
    ok: true,
    json: () => Promise.resolve({ url: '/uploads/test-image.jpg' })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve(mockFetchResponse));
  });

  it('renders upload area', () => {
    render(<ImageUpload onUpload={mockOnUpload} />);
    expect(screen.getByText(/drag & drop an image here/i)).toBeInTheDocument();
  });
  it('changes text when dragging', () => {
    const mockReactDropzone = require('react-dropzone');
    mockReactDropzone.useDropzone.mockReturnValueOnce({
      getRootProps: jest.fn().mockReturnValue({}),
      getInputProps: jest.fn().mockReturnValue({}),
      isDragActive: true
    });

    render(<ImageUpload onUpload={mockOnUpload} />);
    expect(screen.getByText('Drop the image here')).toBeInTheDocument();
    
    mockReactDropzone.useDropzone.mockReturnValueOnce({
      getRootProps: jest.fn().mockReturnValue({}),
      getInputProps: jest.fn().mockReturnValue({}),
      isDragActive: false
    });

    render(<ImageUpload onUpload={mockOnUpload} />);
    expect(screen.getByText(/drag & drop an image here/i)).toBeInTheDocument();
  });  it('handles file upload', async () => {
    const mockReactDropzone = require('react-dropzone');
    const onDropMock = jest.fn();
    mockReactDropzone.useDropzone.mockReturnValueOnce({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false
    });

    render(<ImageUpload onUpload={mockOnUpload} />);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    // Get the useDropzone props
    const dropzoneProps = mockReactDropzone.useDropzone.mock.calls[0][0];
    
    // Call the onDrop function directly with our test file
    await dropzoneProps.onDrop([file]);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
        method: 'POST'
      }));
      expect(mockOnUpload).toHaveBeenCalledWith('/uploads/test-image.jpg');
    });
  });  it('handles upload errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' })
      })
    );

    const mockReactDropzone = require('react-dropzone');
    mockReactDropzone.useDropzone.mockReturnValueOnce({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false
    });

    render(<ImageUpload onUpload={mockOnUpload} />);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    // Get the useDropzone props and call onDrop directly
    const dropzoneProps = mockReactDropzone.useDropzone.mock.calls[0][0];
    await dropzoneProps.onDrop([file]);

    await waitFor(() => {
      expect(mockOnUpload).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error uploading image:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
  it('validates file types', async () => {
    const mockReactDropzone = require('react-dropzone');
    const mockOnDrop = jest.fn();
    mockReactDropzone.useDropzone.mockReturnValueOnce({
      getRootProps: jest.fn().mockReturnValue({}),
      getInputProps: jest.fn().mockReturnValue({}),
      isDragActive: false,
      onDrop: mockOnDrop
    });

    render(<ImageUpload onUpload={mockOnUpload} />);
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    mockOnDrop([file]);
    
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnUpload).not.toHaveBeenCalled();
  });
});
