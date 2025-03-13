import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CONTENT_LIMITS } from '@/lib/constants';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const gridId = resolvedParams.id;
    
    if (!gridId) {
      return NextResponse.json(
        { error: 'Missing grid ID' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    const { 
      sessionId, 
      title, 
      description, 
      external_url, 
      image_url 
    } = body;

    // Prepare updates object
    const updates: Record<string, any> = {};
    
    // Add fields to updates only if they are provided
    if (title !== undefined) {
      if (title.length > CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Title must be ${CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH} characters or less` },
          { status: 400 }
        );
      }
      updates.title = title;
    }
    
    if (description !== undefined) {
      if (description.length > CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Description must be ${CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH} characters or less` },
          { status: 400 }
        );
      }
      updates.description = description;
    }
    
    if (external_url !== undefined) {
      if (external_url && !external_url.startsWith('https://')) {
        return NextResponse.json(
          { error: 'External URL must start with https://' },
          { status: 400 }
        );
      }
      updates.external_url = external_url;
    }
    
    if (image_url !== undefined) {
      updates.image_url = image_url;
    }
    
    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // First, check if the grid exists
    const { data: existingGrid, error: fetchError } = await supabase
      .from('grids')
      .select('id')
      .eq('id', gridId)
      .single();
      
    if (fetchError) {
      return NextResponse.json(
        { error: 'Grid not found' },
        { status: 404 }
      );
    }

    // Update grid content in Supabase
    const { data: grid, error: updateError } = await supabase
      .from('grids')
      .update(updates)
      .eq('id', gridId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update grid content: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      grid 
    });
  } catch (error) {
    console.error('Error in update-content route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 