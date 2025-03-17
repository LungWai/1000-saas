import { NextResponse } from 'next/server';
import { getGrids } from '@/lib/db';

export async function GET(request: Request) {
  // console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/grids - GET`);
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { grids, total } = await getGrids(page, limit);

    return NextResponse.json({
      grids,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error in /api/grids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grids' },
      { status: 500 }
    );
  }
} 