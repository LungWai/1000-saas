import { NextResponse } from 'next/server';
import { updateGridUrl } from '@/lib/db';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const updateSchema = z.object({
  external_url: z.string().url(),
  subscriptionId: z.string(),
  email: z.string().email(),
});

// Add type guard for customer
const isCustomer = (customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>): customer is Stripe.Response<Stripe.Customer> => {
  return !('deleted' in customer);
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/grids/[id]/url - PUT - ID: ${params.id}`);
  try {
    const body = await request.json();
    const { subscriptionId, email, external_url } = updateSchema.parse(body);
    const resolvedParams = await Promise.resolve(params);

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

    const updatedGrid = await updateGridUrl(
      resolvedParams.id,
      subscription.customer as string,
      external_url
    );

    return NextResponse.json(updatedGrid);
  } catch (error) {
    console.error('Error in /api/grids/[id]/url:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update grid URL' },
      { status: 500 }
    );
  }
} 