'use client';

import { useState, useEffect } from 'react';
import { GridProps } from '@/types';
import GridContainer from '@/components/GridContainer';
import { GRID_CONFIG, PRICING } from '@/lib/constants';

export default function Home() {
  const [grids, setGrids] = useState<GridProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrids();
  }, []);

  const fetchGrids = async () => {
    try {
      const response = await fetch('/api/grids');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch grids');
      }

      const formattedGrids = data.grids.map((grid: any) => ({
        id: grid.id,
        status: grid.customerId ? 'leased' : 'empty',
        price: PRICING.BASE_PRICE,
        imageUrl: grid.image_url,
        title: grid.title,
        description: grid.description,
        externalUrl: grid.external_url,
      }));

      setGrids(formattedGrids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grids');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (gridId: string) => {
    // This will be handled by the PurchaseModal component
    console.log('Grid clicked:', gridId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-7xl mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          1000 Grid Spaces
        </h1>
        <p className="text-lg text-center text-gray-600">
          Lease your piece of digital real estate
        </p>
      </header>

      <div className="w-full max-w-[1920px] overflow-x-auto">
        <GridContainer
          grids={grids}
          containerSize={GRID_CONFIG.TOTAL_GRIDS}
          columns={GRID_CONFIG.BREAKPOINTS.lg.columns}
          onPurchaseClick={handlePurchaseClick}
        />
      </div>

      <footer className="w-full max-w-7xl mt-8 text-center text-sm text-gray-500">
        <p>Starting at ${PRICING.BASE_PRICE}/month per grid</p>
      </footer>
    </main>
  );
}
