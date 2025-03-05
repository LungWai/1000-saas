import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { updateGridContent, getGridById } from '@/lib/db';
import { sendPurchaseConfirmation } from '@/lib/resend';
import Stripe from 'stripe';

// Add type guard for Stripe Customer
const isActiveCustomer = (customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>): customer is Stripe.Response<Stripe.Customer> => {
  return !('deleted' in customer);
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Validate required session data
        if (!session.metadata?.gridId) {
          throw new Error('Missing gridId in session metadata');
        }
        
        if (!session.customer) {
          throw new Error('Missing customer in session');
        }
        
        if (!session.subscription) {
          throw new Error('Missing subscription in session');
        }

        const gridId = session.metadata.gridId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const customer = await stripe.customers.retrieve(customerId as string);
        
        // Check if customer is active
        if (!isActiveCustomer(customer)) {
          throw new Error('Customer not found or deleted');
        }

        // Check if customer has email
        if (!customer.email) {
          throw new Error('Customer email not found');
        }

        const grid = await getGridById(gridId);

        if (!grid) {
          throw new Error('Grid not found');
        }

        // Calculate grid location (e.g., "Row 5, Column 10")
        const gridNumber = parseInt(gridId);
        const totalColumns = 25; // From GRID_CONFIG.BREAKPOINTS.lg.columns
        const row = Math.floor(gridNumber / totalColumns) + 1;
        const column = (gridNumber % totalColumns) + 1;
        const gridLocation = `Row ${row}, Column ${column}`;

        // Update grid status and details
        const updatedGrid = await updateGridContent(gridId, customerId as string, {
          status: 'active',
          subscription_id: subscriptionId as string,
          start_date: new Date(subscription.current_period_start * 1000),
          end_date: new Date(subscription.current_period_end * 1000),
        });

        // Send confirmation email
        await sendPurchaseConfirmation({
          email: customer.email,
          gridId,
          subscriptionId: subscriptionId as string,
          amount: subscription.items.data[0].price.unit_amount!,
          renewalDate: new Date(subscription.current_period_end * 1000),
          gridLocation,
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const gridId = subscription.metadata.gridId;

        if (!gridId) {
          throw new Error('Missing gridId in subscription metadata');
        }

        const grid = await getGridById(gridId);
        if (!grid) {
          throw new Error('Grid not found');
        }

        await updateGridContent(gridId, subscription.customer as string, {
          status: subscription.status === 'active' ? 'active' : 'inactive',
          end_date: new Date(subscription.current_period_end * 1000),
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const gridId = subscription.metadata.gridId;

        if (!gridId) {
          throw new Error('Missing gridId in subscription metadata');
        }

        const grid = await getGridById(gridId);
        if (!grid) {
          throw new Error('Grid not found');
        }

        await updateGridContent(gridId, subscription.customer as string, {
          status: 'inactive',
          end_date: new Date(),
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 