import { NextResponse } from 'next/server';
import { getGridById } from '@/lib/db';
import { captureException } from '@/lib/sentry';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const grid = await getGridById(params.id);

    if (!grid) {
      return NextResponse.json(
        { error: 'Grid not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(grid);
  } catch (error) {
    captureException(error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch grid' },
      { status: 500 }
    );
  }
} 