import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { 
  getGridById, 
  findOrCreateUserByStripeCustomer, 
  updateGridFromWebhook,
  getGridBySubscription,
  createOrUpdateSubscription
} from '@/lib/db';
import { sendPurchaseConfirmation } from '@/lib/resend';
import Stripe from 'stripe';

// Add type guard for Stripe Customer
const isActiveCustomer = (customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>): customer is Stripe.Response<Stripe.Customer> => {
  return !('deleted' in customer);
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      
      console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/webhooks/stripe - POST - Event: ${event.type}`);
      
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return new NextResponse('Webhook signature verification failed', { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        try {
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
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customer = await stripe.customers.retrieve(customerId);
          
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

          // Find or create user with the Stripe customer ID using security definer function
          const user = await findOrCreateUserByStripeCustomer(
            customer.email,
            customerId,
            'active'
          );

          // Save subscription information to the database
          await createOrUpdateSubscription({
            id: subscriptionId,
            user_id: user.id,
            grid_id: gridId,
            amount: subscription.items.data[0].price.unit_amount || 0,
            billing_cycle: 'monthly', // Default to monthly
            stripe_subscription_id: subscriptionId,
            status: subscription.status as any,
            next_billing_date: new Date(subscription.current_period_end * 1000),
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000)
          });

          // Update grid with subscription information using security definer function
          await updateGridFromWebhook(
            gridId,
            user.id,
            subscriptionId,
            'active',
            new Date(),
            new Date(subscription.current_period_end * 1000)
          );

          // Send confirmation email
          await sendPurchaseConfirmation({
            email: customer.email,
            gridId,
            subscriptionId,
            amount: subscription.items.data[0].price.unit_amount!,
            renewalDate: new Date(subscription.current_period_end * 1000),
            gridLocation,
          });
          
          return NextResponse.json({ 
            received: true, 
            message: "Checkout session processed successfully" 
          });
        } catch (error) {
          console.error('Error handling checkout session:', error);
          // Don't throw - return a 200 response with error details
          // This prevents Stripe from retrying, which can lead to duplicate charges
          return NextResponse.json({
            received: true,
            error: error instanceof Error ? error.message : 'Unknown error processing checkout',
          });
        }
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated event received:', JSON.stringify(subscription, null, 2));
        
        if (!subscription.id) {
          console.log('Missing subscription ID in event data');
          return NextResponse.json({ received: true, message: "Missing subscription ID" });
        }

        // Get the full subscription data from Stripe
        const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
        
        // Get customer information
        let customerId = fullSubscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        
        if (!isActiveCustomer(customer)) {
          console.log('Customer not found or deleted');
          return NextResponse.json({ received: true, message: "Customer not found" });
        }

        // Get user from our database
        const user = await findOrCreateUserByStripeCustomer(
          customer.email || 'unknown@example.com',
          customerId,
          'active'
        );

        // First, update the subscription in our database
        let gridId = fullSubscription.metadata?.gridId;
        
        // Find the related subscription in our database
        try {
          // Look for the grid even if we don't have the gridId from metadata
          let grid = null;
          
          // Get grid from the database if we have metadata
          if (gridId) {
            grid = await getGridById(gridId);
          } else {
            // Try to find grid by subscription ID
            try {
              grid = await getGridBySubscription(subscription.id);
              if (grid) {
                gridId = grid.id;
              }
            } catch (err) {
              console.log('No existing grid found for this subscription - may be normal for some updates');
            }
          }

          // Always update the subscription record even if we can't find a grid
          await createOrUpdateSubscription({
            id: subscription.id,
            user_id: user.id,
            grid_id: gridId, // This might be null for some updates
            amount: fullSubscription.items.data[0].price.unit_amount || 0,
            billing_cycle: 'monthly', // Default to monthly
            stripe_subscription_id: subscription.id,
            status: fullSubscription.status as any,
            next_billing_date: new Date(fullSubscription.current_period_end * 1000),
            current_period_start: new Date(fullSubscription.current_period_start * 1000),
            current_period_end: new Date(fullSubscription.current_period_end * 1000)
          });

          // If we found a grid, update it too
          if (grid && gridId) {
            await updateGridFromWebhook(
              gridId,
              user.id,
              subscription.id,
              fullSubscription.status === 'active' ? 'active' : 'inactive',
              undefined,
              new Date(fullSubscription.current_period_end * 1000)
            );
          }

          return NextResponse.json({ 
            received: true, 
            message: grid ? "Grid and subscription updated" : "Subscription updated without grid" 
          });
          
        } catch (error) {
          console.error('Error handling subscription update:', error);
          // Return a 200 error response to avoid Stripe retries that could cause duplicate updates
          return NextResponse.json({
            received: true,
            error: error instanceof Error ? error.message : 'Failed to process subscription update',
          });
        }
      }

      case 'customer.subscription.deleted': {
        try {
          const subscription = event.data.object as Stripe.Subscription;
          
          // Try to get gridId from metadata first
          let gridId = subscription.metadata?.gridId;
          let grid;
          
          // If no gridId in metadata, find the grid by subscription_id
          if (!gridId) {
            try {
              // Find grid by subscription id in our database
              grid = await getGridBySubscription(subscription.id);
              if (grid) {
                gridId = grid.id;
              } else {
                console.log(`No grid found for subscription ${subscription.id}`);
                // For a deleted subscription without a grid, we need to get the user ID
                // from Stripe to update the subscription record
                const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
                const customerId = fullSubscription.customer as string;
                const customer = await stripe.customers.retrieve(customerId);
                
                if (!isActiveCustomer(customer)) {
                  console.log('Customer not found or deleted');
                  return NextResponse.json({ received: true, message: "Customer not found" });
                }

                // Get user from our database
                const user = await findOrCreateUserByStripeCustomer(
                  customer.email || 'unknown@example.com',
                  customerId,
                  'active'
                );

                // Update the subscription record with canceled status even without a grid
                await createOrUpdateSubscription({
                  id: subscription.id,
                  user_id: user.id,
                  status: 'canceled',
                  next_billing_date: new Date(),
                  current_period_start: new Date(subscription.current_period_start * 1000),
                  current_period_end: new Date() // For deleted subscriptions, use current date as end
                });
                
                return NextResponse.json({ received: true, message: "Subscription marked as canceled" });
              }
            } catch (error) {
              console.error('Error finding grid by subscription:', error);
              // For deletion events, don't throw an error if we can't find the grid
              // Just log it and return success
              return NextResponse.json({ received: true, message: "No grid found for deleted subscription" });
            }
          } else {
            // Get grid by ID if we have it from metadata
            grid = await getGridById(gridId);
            if (!grid) {
              console.log(`No grid found with ID ${gridId}`);
              return NextResponse.json({ received: true, message: "No grid found for deleted subscription" });
            }
          }

          // Update grid using security definer function
          await updateGridFromWebhook(
            gridId,
            grid.user_id,
            subscription.id,
            'inactive',
            undefined,
            new Date()
          );

          // Also update the subscription status in our database
          await createOrUpdateSubscription({
            id: subscription.id,
            user_id: grid.user_id,
            grid_id: gridId,
            status: 'canceled',
            next_billing_date: new Date(),
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date() // For deleted subscriptions, set end to current date
          });
          
          return NextResponse.json({ received: true, message: "Subscription deleted successfully" });
        } catch (error) {
          console.error('Error handling subscription deletion:', error);
          // Return a 200 response with error details to avoid Stripe retries
          return NextResponse.json({
            received: true,
            error: error instanceof Error ? error.message : 'Failed to process subscription deletion',
          });
        }
      }
      
      // Handle other webhook events
      default: {
        // Just acknowledge receipt for events we don't handle specifically
        return NextResponse.json({ received: true });
      }
    }
  } catch (error) {
    console.error('Error in Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 