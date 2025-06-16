import { optimizeImage, generateThumbnail } from '../image-optimizer';
import sharp from 'sharp';

// Mock sharp
jest.mock('sharp', () => {
  // Create a mock function that can be reconfigured between tests
  const mockSharp = jest.fn().mockReturnValue({
    metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image')),
  });
  
  return mockSharp;
});

describe('Image Optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the default sharp mock for each test
    (sharp as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image')),
    });
  });
  
  describe('optimizeImage function', () => {
    it('optimizes image with default settings', async () => {
      const buffer = Buffer.from('test-image');
      
      await optimizeImage(buffer);
      
      // Check sharp was called with the input buffer
      expect(sharp).toHaveBeenCalledWith(buffer);
      
      // Check metadata was called
      const mockSharpInstance = (sharp as jest.Mock).mock.results[0].value;
      expect(mockSharpInstance.metadata).toHaveBeenCalled();
      
      // Check resize was called with correct dimensions
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(1200, 900, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      
      // Check format conversion was called
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 80 });
      
      // Check buffer was returned
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });
    
    it('optimizes image with custom settings', async () => {
      const buffer = Buffer.from('test-image');
      const config = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 90,
        format: 'jpeg' as const,
      };
      
      await optimizeImage(buffer, config);
      
      const mockSharpInstance = (sharp as jest.Mock).mock.results[0].value;
      
      // Check resize was called with custom dimensions
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      
      // Check format conversion was called with custom quality
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 90 });
    });
    
    it('handles different output formats', async () => {
      const buffer = Buffer.from('test-image');
      
      await optimizeImage(buffer, { format: 'png' });
      
      const mockSharpInstance = (sharp as jest.Mock).mock.results[0].value;
      expect(mockSharpInstance.png).toHaveBeenCalled();
    });
    
    it('throws an error if image dimensions cannot be read', async () => {
      const buffer = Buffer.from('test-image');
      
      // Mock metadata to return no dimensions
      (sharp as jest.Mock).mockReturnValueOnce({
        metadata: jest.fn().mockResolvedValue({}),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockReturnThis(),
      });
      
      // Mock console.error to prevent error output in test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(optimizeImage(buffer)).rejects.toThrow('Could not read image dimensions');
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
    
    it('handles errors from sharp', async () => {
      const buffer = Buffer.from('test-image');
      
      // Mock sharp to throw an error
      const error = new Error('Sharp processing failed');
      (sharp as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });
      
      // Mock console.error to prevent error output in test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(optimizeImage(buffer)).rejects.toThrow('Sharp processing failed');
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('generateThumbnail function', () => {
    it('generates thumbnail with default size', async () => {
      const buffer = Buffer.from('test-image');
      
      await generateThumbnail(buffer);
      
      // Check sharp was called with the input buffer
      expect(sharp).toHaveBeenCalledWith(buffer);
      
      const mockSharpInstance = (sharp as jest.Mock).mock.results[0].value;
      
      // Check resize was called with correct settings
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(200, 200, {
        fit: 'cover',
        position: 'centre',
      });
      
      // Check webp was called
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 80 });
      
      // Check buffer was returned
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });
    
    it('generates thumbnail with custom size', async () => {
      const buffer = Buffer.from('test-image');
      
      await generateThumbnail(buffer, 100);
      
      const mockSharpInstance = (sharp as jest.Mock).mock.results[0].value;
      
      // Check resize was called with custom size
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(100, 100, {
        fit: 'cover',
        position: 'centre',
      });
    });
    
    it('handles errors', async () => {
      const buffer = Buffer.from('test-image');
      
      // Mock sharp to throw an error
      const error = new Error('Thumbnail generation failed');
      (sharp as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });
      
      // Mock console.error to prevent error output in test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(generateThumbnail(buffer)).rejects.toThrow('Thumbnail generation failed');
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
}); 