import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }
    
    // Determine the bucket name from the path (assuming format: bucket-name/file-path)
    const parts = path.split('/');
    const bucketName = parts[0];
    const filePath = parts.slice(1).join('/');
    
    if (!bucketName || !filePath) {
      return NextResponse.json(
        { error: 'Invalid path format. Expected: bucket-name/file-path' },
        { status: 400 }
      );
    }
    
    // Download the file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      console.error('Error downloading file from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
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
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
} 