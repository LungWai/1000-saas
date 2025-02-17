import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CONTENT_LIMITS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const gridId = formData.get('gridId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!gridId) {
      return NextResponse.json(
        { error: 'No grid ID provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > CONTENT_LIMITS.IMAGE.MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size must be less than ${CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and GIF images are allowed' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `grid-${gridId}-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('grid-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('grid-images')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
} 