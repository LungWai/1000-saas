import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscriptionId, email, gridId } = body;

    if (!subscriptionId || !email || !gridId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the provided ID is a customer ID (starting with 'cus_') or subscription ID (starting with 'sub_')
    const isCustomerId = subscriptionId.startsWith('cus_');
    const isSubscriptionId = subscriptionId.startsWith('sub_');
    
    let userId;
    let hasAccess = false;

    // First, verify the email exists and is associated with the ID provided
    if (isCustomerId) {
      // If customer ID is provided, find the user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, subscription_status')
        .eq('stripe_customer_id', subscriptionId)
        .eq('email', email)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Invalid credentials or user not found' },
          { status: 403 }
        );
      }

      if (user.subscription_status !== 'active') {
        return NextResponse.json(
          { error: 'Your subscription is not active' },
          { status: 403 }
        );
      }

      userId = user.id;

      // Check if this user owns the grid
      const { data: grid, error: gridError } = await supabase
        .from('grids')
        .select('user_id')
        .eq('id', gridId)
        .single();

      if (!gridError && grid && grid.user_id === userId) {
        hasAccess = true;
      }
    } else if (isSubscriptionId) {
      // If subscription ID is provided, check the subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, grid_id, status')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subError || !subscription) {
        return NextResponse.json(
          { error: 'Invalid subscription ID' },
          { status: 403 }
        );
      }

      if (subscription.status !== 'active') {
        return NextResponse.json(
          { error: 'Your subscription is not active' },
          { status: 403 }
        );
      }

      // Verify the email belongs to the user with this subscription
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', subscription.user_id)
        .single();

      if (userError || !user || user.email !== email) {
        return NextResponse.json(
          { error: 'Email does not match subscription owner' },
          { status: 403 }
        );
      }

      userId = subscription.user_id;

      // Check if this subscription is for the requested grid
      if (subscription.grid_id === gridId) {
        hasAccess = true;
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid ID format. Please provide a valid subscription or customer ID' },
        { status: 400 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this grid' },
        { status: 403 }
      );
    }

    // Verification successful, return user ID for further operations
    return NextResponse.json({ 
      verified: true, 
      userId,
      subscriptionId
    });
    
  } catch (error) {
    console.error('Error in verification:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
} 