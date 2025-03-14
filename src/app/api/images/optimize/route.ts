import { NextResponse } from 'next/server';
import { optimizeImage } from '@/lib/image-optimizer';

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get optimization options from the request
    const format = formData.get('format') as 'jpeg' | 'webp' | 'png' || 'webp';
    
    console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/images/optimize - POST - File: ${file.name}, Format: ${format}`);
    
    const quality = parseInt(formData.get('quality') as string || '80', 10);
    const maxWidth = parseInt(formData.get('maxWidth') as string || '1200', 10);
    const maxHeight = parseInt(formData.get('maxHeight') as string || '1200', 10);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize the image
    const optimizedBuffer = await optimizeImage(buffer, {
      format,
      quality,
      maxWidth,
      maxHeight
    });

    // Create a new file from the optimized buffer
    const optimizedFile = new File(
      [optimizedBuffer],
      file.name.replace(/\.[^/.]+$/, `.${format}`),
      { type: `image/${format}` }
    );

    // Return the optimized file as a blob
    return new NextResponse(optimizedBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, `.${format}`)}"`,
      },
    });
  } catch (error) {
    console.error('Error optimizing image:', error);
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    );
  }
} 