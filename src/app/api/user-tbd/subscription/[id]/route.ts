import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const updateSchema = z.object({
  billing_cycle: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  cancel_at_period_end: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/user/subscription/[id] - PUT - Subscription ID: ${params.id}`);
  try {
    const body = await request.json();
    const { billing_cycle, cancel_at_period_end } = updateSchema.parse(body);

    // Get user ID from auth header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription in Stripe
    if (billing_cycle) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      const currentPrice = stripeSubscription.items.data[0].price;

      // Create new price with updated billing cycle
      const newPrice = await stripe.prices.create({
        unit_amount: currentPrice.unit_amount!,
        currency: currentPrice.currency,
        recurring: {
          interval: billing_cycle === 'yearly' ? 'year' :
                   billing_cycle === 'quarterly' ? 'month' : 'month',
          interval_count: billing_cycle === 'quarterly' ? 3 : 1,
        },
        product: currentPrice.product as string,
      });

      // Update subscription with new price
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: newPrice.id,
        }],
        proration_behavior: 'create_prorations',
      });
    }

    if (typeof cancel_at_period_end !== 'undefined') {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end,
      });
    }

    // Update subscription in database
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        billing_cycle: billing_cycle || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error in /api/user/subscription/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 