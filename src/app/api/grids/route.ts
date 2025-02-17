import { NextResponse } from 'next/server';
import { getGrids } from '@/lib/db';
import { captureException } from '@/lib/sentry';

export async function GET(request: Request) {
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
    captureException(error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch grids' },
      { status: 500 }
    );
  }
} 