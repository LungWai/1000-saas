import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Grid } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user ID from auth header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's grids with pagination
    const { data: grids, error, count } = await supabase
      .from('grids')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching user grids:', error);
      return NextResponse.json(
        { error: 'Failed to fetch grids' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      grids: grids as Grid[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in /api/user/grids:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 