import { NextResponse } from 'next/server';
import { updateGridContent } from '@/lib/db';
import { captureException } from '@/lib/sentry';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';

const urlSchema = z.object({
  external_url: z.string().url().startsWith('https://', { message: 'URL must start with https://' }),
  subscriptionId: z.string(),
  email: z.string().email(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { subscriptionId, email, external_url } = urlSchema.parse(body);

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
      { external_url }
    );

    return NextResponse.json(updatedGrid);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid URL format', details: error.errors },
        { status: 400 }
      );
    }

    captureException(error as Error);
    return NextResponse.json(
      { error: 'Failed to update grid URL' },
      { status: 500 }
    );
  }
} 