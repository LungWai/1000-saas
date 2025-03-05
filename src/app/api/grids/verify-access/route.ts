import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EditAccess } from '@/types';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body: EditAccess = await request.json();
    const { subscriptionId, email, gridId } = body;

    // Verify subscription exists and is active
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status, grid_id, user_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 403 }
      );
    }

    if (subscription.grid_id !== gridId) {
      return NextResponse.json(
        { error: 'Subscription is not for this grid' },
        { status: 403 }
      );
    }

    // Verify user email matches
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', subscription.user_id)
      .single();

    if (userError || !user || user.email !== email) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying access:', error);
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    );
  }
} 