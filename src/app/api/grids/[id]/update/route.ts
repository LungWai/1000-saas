import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Grid } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONTENT_LIMITS = {
  TITLE_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 250,
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gridId = params.id;
    const body = await request.json();
    const { subscriptionId, email, updates } = body;

    // First verify access
    const verifyResponse = await fetch('/api/grids/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, email, gridId }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return NextResponse.json(
        { error: error.message || 'Access verification failed' },
        { status: verifyResponse.status }
      );
    }

    // Validate content
    if (updates.title && updates.title.length > CONTENT_LIMITS.TITLE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Title must be ${CONTENT_LIMITS.TITLE_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (updates.description && updates.description.length > CONTENT_LIMITS.DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${CONTENT_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (updates.external_url) {
      try {
        new URL(updates.external_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Update grid content
    const { data: grid, error: updateError } = await supabase
      .from('grids')
      .update(updates)
      .eq('id', gridId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating grid:', updateError);
      return NextResponse.json(
        { error: 'Failed to update grid content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ grid });
  } catch (error) {
    console.error('Error updating grid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 