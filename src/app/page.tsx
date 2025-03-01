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
      let allGrids: any[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      // First request to get total count
      const initialResponse = await fetch('/api/grids?page=1&limit=200');
      const initialData = await initialResponse.json();
      
      if (!initialResponse.ok) {
        throw new Error(initialData.error || 'Failed to fetch grids');
      }
      
      allGrids = [...initialData.grids];
      totalPages = initialData.totalPages;
      
      // Fetch remaining pages if needed
      for (let page = 2; page <= totalPages; page++) {
        const response = await fetch(`/api/grids?page=${page}&limit=200`);
        const data = await response.json();
        
        if (!response.ok) {
          continue;
        }
        
        allGrids = [...allGrids, ...data.grids];
      }

      if (allGrids.length === 0) {
        setError('No grid data available. Please check your database connection.');
        setLoading(false);
        return;
      }

      const formattedGrids = allGrids.map((grid: any) => ({
        id: grid.id.toString(),
        status: grid.status === 'active' ? 'leased' : 'empty',
        price: grid.price || PRICING.BASE_PRICE,
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
