import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, createCustomer, getStripeSession } from '@/lib/stripe';
import { createGrid } from '@/lib/db';
import { PRICING } from '@/lib/constants';

const subscribeSchema = z.object({
  gridId: z.string(),
  email: z.string().email(),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gridId, email, billingCycle } = subscribeSchema.parse(body);

    // Create Stripe customer
    const customer = await createCustomer(email);

    // Create price based on billing cycle
    const amount = PRICING.BASE_PRICE * (
      billingCycle === 'yearly' ? 12 * 0.9 : // 10% discount for yearly
      billingCycle === 'quarterly' ? 3 * 0.95 : // 5% discount for quarterly
      1
    );

    const price = await stripe.prices.create({
      unit_amount: amount * 100, // convert to cents
      currency: PRICING.CURRENCY,
      recurring: {
        interval: billingCycle === 'yearly' ? 'year' :
                 billingCycle === 'quarterly' ? 'month' : 'month',
        interval_count: billingCycle === 'quarterly' ? 3 : 1,
      },
      product_data: {
        name: `Grid Space ${gridId} - ${billingCycle} subscription`,
      },
    });

    // Create grid record
    const grid = await createGrid({
      user_id: customer.id, // Using Stripe customer ID as user ID
      status: 'pending',
      title: '',
      description: '',
      image_url: '',
      external_url: '',
      subscription_id: '', // Will be updated after successful payment
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Set end date to 1 month from now
      content: null,
      customerId: customer.id,
      url: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create Stripe checkout session
    const session = await getStripeSession(
      price.id,
      customer.id,
      grid.id
    );

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Error in /api/grids/subscribe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 