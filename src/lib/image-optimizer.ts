import sharp from 'sharp';

interface OptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_CONFIG: OptimizationConfig = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 80,
  format: 'webp',
};

export async function optimizeImage(
  buffer: Buffer,
  config: Partial<OptimizationConfig> = {}
): Promise<Buffer> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image dimensions');
    }

    // Calculate dimensions while maintaining aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    let width = metadata.width;
    let height = metadata.height;

    if (width > finalConfig.maxWidth) {
      width = finalConfig.maxWidth;
      height = Math.round(width / aspectRatio);
    }

    if (height > finalConfig.maxHeight) {
      height = finalConfig.maxHeight;
      width = Math.round(height * aspectRatio);
    }

    // Process image
    let processedImage = image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    // Convert to desired format
    switch (finalConfig.format) {
      case 'jpeg':
        processedImage = processedImage.jpeg({ quality: finalConfig.quality });
        break;
      case 'webp':
        processedImage = processedImage.webp({ quality: finalConfig.quality });
        break;
      case 'png':
        processedImage = processedImage.png({ quality: finalConfig.quality });
        break;
    }

    return processedImage.toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

export async function generateThumbnail(
  buffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  try {
    return sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre',
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
} 