import { NextResponse } from 'next/server';
import { updateGridContent } from '@/lib/db';
import { CONTENT_LIMITS } from '@/lib/constants';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';

const updateSchema = z.object({
  title: z.string().max(CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH).optional(),
  description: z.string().max(CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH).optional(),
  image_url: z.string().url().optional(),
  content: z.string().max(CONTENT_LIMITS.TEXT.CONTENT_MAX_LENGTH).optional(),
  external_url: z.string().url().optional(),
  sessionId: z.string(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { sessionId, ...validatedData } = updateSchema.parse(body);

    // Verify session is valid and related to this grid
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify the session is associated with this grid
    if (!session.metadata?.gridId || session.metadata.gridId !== params.id) {
      return NextResponse.json(
        { error: 'Invalid session for this grid' },
        { status: 403 }
      );
    }

    // Session is valid, update grid content directly
    const updatedGrid = await updateGridContent(
      params.id,
      validatedData
    );

    return NextResponse.json(updatedGrid);
  } catch (error) {
    console.error('Error in /api/grids/[id]/update-content:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update grid content' },
      { status: 500 }
    );
  }
} 