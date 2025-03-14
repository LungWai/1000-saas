import { NextResponse } from 'next/server';
import { getGridById } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[ROUTE_TRACKER] ${new Date().toISOString()} - /api/grids/[id] - GET - ID: ${params.id}`);
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
    console.error('Error in /api/grids/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid' },
      { status: 500 }
    );
  }
} 