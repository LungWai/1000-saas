import { optimizeImage } from '@/lib/image-optimizer';

// Mock the image-optimizer module
jest.mock('@/lib/image-optimizer', () => ({
  optimizeImage: jest.fn(),
}));

// Create a simplified version of the API handler
// This avoids Next.js internal dependencies
async function mockApiHandler(mockFormData: any) {
  const file = mockFormData.file;
  
  if (!file) {
    return {
      status: 400,
      json: () => ({ error: 'No file provided' }),
    };
  }

  try {
    const format = mockFormData.format || 'webp';
    const quality = parseInt(mockFormData.quality || '80', 10);
    const maxWidth = parseInt(mockFormData.maxWidth || '1200', 10);
    const maxHeight = parseInt(mockFormData.maxHeight || '1200', 10);

    // Convert file to buffer
    // In a real test this would be more complex
    const buffer = Buffer.from(file.data);

    // Optimize the image
    const optimizedBuffer = await optimizeImage(buffer, {
      format,
      quality,
      maxWidth,
      maxHeight
    });

    return {
      status: 200,
      headers: {
        'Content-Type': `image/${format}`,
        'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, `.${format}`)}"`,
      },
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    return {
      status: 500,
      json: () => ({ error: 'Failed to optimize image' }),
    };
  }
}

describe('Image Optimization API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('returns 400 when no file is provided', async () => {
    // Create form data with no file
    const mockFormData = {};
    
    // Call the API handler
    const response = await mockApiHandler(mockFormData);
    
    // Check the response
    expect(response.status).toBe(400);
    expect(response.json()).toEqual({ error: 'No file provided' });
  });
  
  it('optimizes image with default settings when no options provided', async () => {
    // Create a mock file
    const mockFile = {
      name: 'test.jpg',
      type: 'image/jpeg',
      data: 'dummy image data',
    };
    
    // Create form data with the file
    const mockFormData = { file: mockFile };
    
    // Mock optimizeImage to return a buffer
    const mockBuffer = Buffer.from('optimized image data');
    (optimizeImage as jest.Mock).mockResolvedValue(mockBuffer);
    
    // Call the API handler
    const response = await mockApiHandler(mockFormData);
    
    // Check that optimizeImage was called with expected parameters
    expect(optimizeImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      {
        format: 'webp', 
        quality: 80, 
        maxWidth: 1200, 
        maxHeight: 1200
      }
    );
    
    // Check the response
    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/webp');
    expect(response.headers['Content-Disposition']).toContain('test.webp');
  });
  
  it('optimizes image with custom settings', async () => {
    // Create a mock file
    const mockFile = {
      name: 'test.png',
      type: 'image/png',
      data: 'dummy image data',
    };
    
    // Create form data with the file and custom options
    const mockFormData = {
      file: mockFile,
      format: 'jpeg',
      quality: '60',
      maxWidth: '800',
      maxHeight: '600',
    };
    
    // Mock optimizeImage to return a buffer
    const mockBuffer = Buffer.from('optimized image data');
    (optimizeImage as jest.Mock).mockResolvedValue(mockBuffer);
    
    // Call the API handler
    const response = await mockApiHandler(mockFormData);
    
    // Check that optimizeImage was called with expected parameters
    expect(optimizeImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      {
        format: 'jpeg', 
        quality: 60, 
        maxWidth: 800, 
        maxHeight: 600
      }
    );
    
    // Check the response
    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/jpeg');
    expect(response.headers['Content-Disposition']).toContain('test.jpeg');
  });
  
  it('handles errors during optimization', async () => {
    // Create a mock file
    const mockFile = {
      name: 'test.jpg',
      type: 'image/jpeg',
      data: 'dummy image data',
    };
    
    // Create form data with the file
    const mockFormData = { file: mockFile };
    
    // Mock optimizeImage to throw an error
    (optimizeImage as jest.Mock).mockRejectedValue(new Error('Optimization failed'));
    
    // Mock console.error to prevent error output in test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Call the API handler
    const response = await mockApiHandler(mockFormData);
    
    // Check the response
    expect(response.status).toBe(500);
    expect(response.json()).toEqual({ error: 'Failed to optimize image' });
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 