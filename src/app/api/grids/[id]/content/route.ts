import { NextResponse } from 'next/server';
import { updateGridContent } from '@/lib/db';
import { CONTENT_LIMITS } from '@/lib/constants';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';

const updateSchema = z.object({
  title: z.string().max(CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH).optional(),
  description: z.string().max(CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH).optional(),
  image_url: z.string().url().optional(),
  subscriptionId: z.string(),
  email: z.string().email(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { subscriptionId, email, ...validatedData } = updateSchema.parse(body);

    // Verify subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive subscription' },
        { status: 403 }
      );
    }

    // Verify email matches customer
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match subscription' },
        { status: 403 }
      );
    }

    const updatedGrid = await updateGridContent(
      params.id,
      subscription.customer as string,
      validatedData
    );

    return NextResponse.json(updatedGrid);
  } catch (error) {
    console.error('Error in /api/grids/[id]/content:', error);
    
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