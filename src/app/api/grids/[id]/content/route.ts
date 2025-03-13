import { NextResponse } from 'next/server';
import { updateGridContentWithVerification } from '@/lib/db';
import { CONTENT_LIMITS } from '@/lib/constants';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateSchema = z.object({
  title: z.string().max(CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH).optional(),
  description: z.string().max(CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH).optional(),
  image_url: z.string().url().optional(),
  external_url: z.string().url().optional(),
  subscriptionId: z.string(), // Can be either subscription_id or customer_id
  email: z.string().email(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { subscriptionId, email, ...validatedData } = updateSchema.parse(body);
    const resolvedParams = await Promise.resolve(params);
    const gridId = resolvedParams.id;

    // Check for super-admin passcode
    if (subscriptionId === 'superAdmin' && email === 'email@email.com') {
      // Super admin has access to all grids
      const { data: updatedGrid, error: updateError } = await supabase
        .from('grids')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', gridId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating grid:', updateError);
        return NextResponse.json(
          { error: 'Failed to update grid content' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedGrid);
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

    // If verification succeeded, update the grid content
    const { data: updatedGrid, error: updateError } = await supabase
      .from('grids')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', gridId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating grid:', updateError);
      return NextResponse.json(
        { error: 'Failed to update grid content' },
        { status: 500 }
      );
    }

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