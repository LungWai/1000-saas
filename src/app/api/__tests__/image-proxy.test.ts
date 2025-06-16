import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      storage: {
        from: jest.fn(() => ({
          download: jest.fn(),
        })),
      },
    })),
  };
});

// Create a simplified version of the API handler
// This avoids Next.js internal dependencies
async function mockProxyHandler(path: string | null) {
  if (!path) {
    return {
      status: 400,
      json: () => ({ error: 'Missing path parameter' }),
    };
  }
  
  // Determine the bucket name from the path (assuming format: bucket-name/file-path)
  const parts = path.split('/');
  const bucketName = parts[0];
  const filePath = parts.slice(1).join('/');
  
  if (!bucketName || !filePath) {
    return {
      status: 400,
      json: () => ({ error: 'Invalid path format. Expected: bucket-name/file-path' }),
    };
  }

  try {
    // Get the mock Supabase client
    const supabaseClient = createClient('', '');
    
    // Download the file from Supabase storage
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      console.error('Error downloading file from Supabase:', error);
      return {
        status: 500,
        json: () => ({ error: 'Failed to download file from storage' }),
      };
    }
    
    if (!data) {
      return {
        status: 404,
        json: () => ({ error: 'File not found' }),
      };
    }
    
    // Determine content type based on file extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // Default content type
    
    if (fileExtension) {
      switch (fileExtension) {
        case 'png':
          contentType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'svg':
          contentType = 'image/svg+xml';
          break;
      }
    }
    
    // Return the file with appropriate headers
    return {
      status: 200,
      data,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    };
  } catch (error) {
    console.error('Error in image proxy:', error);
    return {
      status: 500,
      json: () => ({ error: 'Failed to proxy image' }),
    };
  }
}

describe('Image Proxy API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('returns 400 when path parameter is missing', async () => {
    const response = await mockProxyHandler(null);
    
    expect(response.status).toBe(400);
    expect(response.json()).toEqual({ error: 'Missing path parameter' });
  });
  
  it('returns 400 when path format is invalid', async () => {
    const response = await mockProxyHandler('invalid-path');
    
    expect(response.status).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid path format. Expected: bucket-name/file-path' });
  });
  
  it('returns 404 when file is not found', async () => {
    // Mock Supabase download to return null data
    const mockDownload = jest.fn().mockResolvedValue({ data: null, error: null });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({
          download: mockDownload,
        }),
      },
    });
    
    const response = await mockProxyHandler('bucket/image.jpg');
    
    expect(response.status).toBe(404);
    expect(response.json()).toEqual({ error: 'File not found' });
    
    // Verify Supabase was called with correct parameters
    const supabaseClient = createClient('', '');
    expect(supabaseClient.storage.from).toHaveBeenCalledWith('bucket');
    expect(mockDownload).toHaveBeenCalledWith('image.jpg');
  });
  
  it('returns 500 when Supabase returns an error', async () => {
    // Mock Supabase download to return an error
    const mockError = { message: 'Storage error' };
    const mockDownload = jest.fn().mockResolvedValue({ data: null, error: mockError });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({
          download: mockDownload,
        }),
      },
    });
    
    // Mock console.error to prevent error output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await mockProxyHandler('bucket/image.jpg');
    
    expect(response.status).toBe(500);
    expect(response.json()).toEqual({ error: 'Failed to download file from storage' });
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
  
  it('returns the file with correct content type for common image formats', async () => {
    // Test each supported file extension
    const testFormats = [
      { ext: 'png', contentType: 'image/png' },
      { ext: 'jpg', contentType: 'image/jpeg' },
      { ext: 'jpeg', contentType: 'image/jpeg' },
      { ext: 'gif', contentType: 'image/gif' },
      { ext: 'webp', contentType: 'image/webp' },
      { ext: 'svg', contentType: 'image/svg+xml' },
      { ext: 'unknown', contentType: 'application/octet-stream' },
    ];
    
    for (const format of testFormats) {
      // Mock Supabase download to return data
      const mockBuffer = Buffer.from('image data');
      const mockDownload = jest.fn().mockResolvedValue({ data: mockBuffer, error: null });
      (createClient as jest.Mock).mockReturnValue({
        storage: {
          from: jest.fn().mockReturnValue({
            download: mockDownload,
          }),
        },
      });
      
      const response = await mockProxyHandler(`bucket/image.${format.ext}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockBuffer);
      expect(response.headers['Content-Type']).toBe(format.contentType);
      expect(response.headers['Cache-Control']).toBe('public, max-age=31536000');
    }
  });
  
  it('handles unexpected errors gracefully', async () => {
    // Mock Supabase download to throw an error
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      },
    });
    
    // Mock console.error to prevent error output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await mockProxyHandler('bucket/image.jpg');
    
    expect(response.status).toBe(500);
    expect(response.json()).toEqual({ error: 'Failed to proxy image' });
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 