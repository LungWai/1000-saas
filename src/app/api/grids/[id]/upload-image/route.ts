import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { optimizeImage, generateThumbnail } from '@/lib/image-optimizer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gridId = params.id;
    
    // Verify subscription from Authorization header
    const subscriptionId = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing authorization' },
        { status: 401 }
      );
    }

    // Verify subscription is active and matches grid
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status, grid_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive subscription' },
        { status: 403 }
      );
    }

    if (subscription.grid_id !== gridId) {
      return NextResponse.json(
        { error: 'Subscription is not for this grid' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image and generate thumbnail
    const [optimizedBuffer, thumbnailBuffer] = await Promise.all([
      optimizeImage(buffer),
      generateThumbnail(buffer),
    ]);

    // Generate unique filenames
    const timestamp = Date.now();
    const mainFilename = `${gridId}-${timestamp}-main.webp`;
    const thumbnailFilename = `${gridId}-${timestamp}-thumb.webp`;

    // Upload both versions to Supabase Storage
    const [mainUpload, thumbnailUpload] = await Promise.all([
      supabase.storage
        .from('grid-images')
        .upload(mainFilename, optimizedBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        }),
      supabase.storage
        .from('grid-images')
        .upload(thumbnailFilename, thumbnailBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        }),
    ]);

    if (mainUpload.error || thumbnailUpload.error) {
      console.error('Error uploading files:', {
        main: mainUpload.error,
        thumbnail: thumbnailUpload.error,
      });
      return NextResponse.json(
        { error: 'Failed to upload files' },
        { status: 500 }
      );
    }

    // Get public URLs
    const { data: { publicUrl: mainUrl } } = supabase.storage
      .from('grid-images')
      .getPublicUrl(mainFilename);

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('grid-images')
      .getPublicUrl(thumbnailFilename);

    return NextResponse.json({
      url: mainUrl,
      thumbnailUrl,
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 