'use client';

import { useState } from 'react';
import { GridProps } from '@/types';
import GridContainer from '@/components/GridContainer';
import { GRID_CONFIG, PRICING } from '@/lib/constants';

export default function Home() {
  const [grids, setGrids] = useState<GridProps[]>([]);

  const handlePurchaseClick = async (gridId: string) => {
    // TODO: Implement purchase flow
    console.log('Purchase clicked for grid:', gridId);
  };

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
        />
      </div>

      <footer className="w-full max-w-7xl mt-8 text-center text-sm text-gray-500">
        <p>Starting at ${PRICING.BASE_PRICE}/month per grid</p>
      </footer>
    </main>
  );
}
