import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Grid } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user ID from auth header
    const userId = request.headers.get('x-user-id');
    
    // console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/user/grids - GET - User ID: ${userId}`);
    
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