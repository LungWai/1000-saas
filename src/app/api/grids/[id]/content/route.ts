import { NextResponse } from 'next/server';
import { updateGridContentWithVerification } from '@/lib/db';
import { CONTENT_LIMITS } from '@/lib/constants';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const updateSchema = z.object({
  title: z.string().max(CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH).optional(),
  description: z.string().max(CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH).optional(),
  image_url: z.string().url().optional(),
  content: z.string().max(CONTENT_LIMITS.TEXT.CONTENT_MAX_LENGTH).optional(),
  external_url: z.string().url().optional(),
  subscriptionId: z.string(),
  email: z.string().email(),
});

// Add type guard
const isCustomer = (customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>): customer is Stripe.Response<Stripe.Customer> => {
  return !('deleted' in customer);
};

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

    if (!isCustomer(customer)) {
      return NextResponse.json(
        { error: 'Customer not found or deleted' },
        { status: 404 }
      );
    }

    if (customer.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match subscription' },
        { status: 403 }
      );
    }

    // Use the new function with customer verification
    const updatedGrid = await updateGridContentWithVerification(
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

    if (error instanceof Error && error.message.includes('not owned by this customer')) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this grid' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update grid content' },
      { status: 500 }
    );
  }
} 