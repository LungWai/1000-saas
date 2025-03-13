import { NextResponse } from 'next/server';
import { getGridById } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Make sure we have the ID parameter
    const resolvedParams = await Promise.resolve(params);
    
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json(
        { error: 'Missing grid ID' },
        { status: 400 }
      );
    }
    
    const id = resolvedParams.id;
    const grid = await getGridById(id);
    
    if (!grid) {
      return NextResponse.json(
        { error: 'Grid not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ grid });
  } catch (error) {
    console.error('Error fetching grid:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid data' },
      { status: 500 }
    );
  }
} 