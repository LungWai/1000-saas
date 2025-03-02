import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICING } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const { gridId, email, billingCycle, returnUrl } = await request.json();

    if (!gridId) {
      return NextResponse.json(
        { error: 'Grid ID is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Calculate price based on billing cycle
    const basePrice = PRICING.BASE_PRICE;
    const priceMultiplier = billingCycle === 'yearly' 
      ? 12 * 0.9 // 10% yearly discount
      : billingCycle === 'quarterly'
      ? 3 * 0.95 // 5% quarterly discount
      : 1;
    
    const interval = billingCycle === 'yearly' 
      ? 'year' 
      : billingCycle === 'quarterly'
      ? 'month' 
      : 'month';

    const quantity = billingCycle === 'quarterly' ? 3 : 1;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Grid Space #${gridId}`,
              description: `${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} lease for your grid space`,
            },
            unit_amount: Math.round(basePrice * 100 * priceMultiplier / quantity), // Convert to cents and adjust for billing cycle
            recurring: {
              interval: interval as Stripe.Price.Recurring.Interval,
              interval_count: interval === 'month' && billingCycle === 'quarterly' ? 3 : 1,
            },
          },
          quantity: quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&grid=${gridId}&status=success`,
      cancel_url: `${returnUrl}?grid=${gridId}&status=cancelled`,
      metadata: {
        gridId,
        email,
        billingCycle,
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 