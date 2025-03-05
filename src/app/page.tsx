'use client';

import { useState, useEffect } from 'react';
import { GridProps } from '@/types';
import GridContainer from '@/components/GridContainer';
import { GRID_CONFIG, PRICING, COMPANY_INFO } from '@/lib/constants';
import Image from 'next/image';

// Add type for API response at the top with other imports
interface GridResponse {
  id: string;
  status: 'active' | 'inactive' | 'pending';
  price: number;
  image_url?: string;
  title?: string;
  description?: string;
  external_url?: string;
}

export default function Home() {
  const [grids, setGrids] = useState<GridProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    fetchGrids();
    
    // Add animation for header and hero
    const headerTimer = setTimeout(() => {
      setHeaderVisible(true);
    }, 100);
    
    const heroTimer = setTimeout(() => {
      setHeroVisible(true);
    }, 300);
    
    return () => {
      clearTimeout(headerTimer);
      clearTimeout(heroTimer);
    };
  }, []);

  const fetchGrids = async () => {
    try {
      let allGrids: GridResponse[] = [];
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

      const formattedGrids: GridProps[] = allGrids.map((grid: GridResponse) => ({
        id: grid.id.toString(),
        status: grid.status === 'active' ? 'leased' : 'empty',
        price: typeof grid.price === 'number' ? grid.price : PRICING.BASE_PRICE,
        imageUrl: grid.image_url,
        title: grid.title,
        description: grid.description,
        externalUrl: grid.external_url,
        onPurchaseClick: () => handlePurchaseClick(grid.id.toString())
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
    console.log(`Purchase clicked for grid: ${gridId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-sm text-gray-500">Loading grid spaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md p-8 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="mb-3 text-lg font-medium text-center">Error Loading Data</h3>
          <p className="text-sm text-gray-500 text-center mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchGrids();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex-col bg-white text-black">
      {/* Header */}
      <header className={`w-full bg-white border-b border-gray-100 py-5 sticky top-0 z-40 backdrop-blur-sm bg-white/90 transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-[1000px] w-full mx-auto px-8">
          {/* Using inline styles to avoid any CSS conflicts */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%',
            gap: '60px' // Large gap between logo and text
          }}>
            <Image 
              src="/logo.png"
              alt="Logo"
              width={480}
              height={480}
              style={{ 
                height: '128px', 
                width: 'auto', 
                objectFit: 'contain',
                display: 'block'
              }}
              priority
            />
            <h1 style={{ 
              fontSize: '3.75rem', 
              fontWeight: '500',
              letterSpacing: '-0.025em',
              whiteSpace: 'nowrap',
              margin: '0'
            }}>1000 SaaS Space</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`w-full bg-white py-16 border-b border-gray-100 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Lease your piece of digital real estate in our curated grid collection
          </p>
        </div>
      </section>

      {/* Grid Container */}
      <section className="w-full overflow-hidden bg-white">
        <div className="w-full">
          <GridContainer
            grids={grids}
            containerSize={GRID_CONFIG.TOTAL_GRIDS}
            columns={GRID_CONFIG.BREAKPOINTS.lg.columns}
            onPurchaseClick={handlePurchaseClick}
          />
        </div>
      </section>

      {/* Simplified Footer - Contact Only */}
      <footer className="w-full bg-white border-t border-gray-100 py-12 mt-auto">
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Contact</h3>
          <div className="flex flex-col items-center space-y-2 mb-4">
            <a href={`mailto:${COMPANY_INFO.CONTACT_EMAIL}`} className="text-sm text-gray-600 hover:text-black transition-colors">
              {COMPANY_INFO.CONTACT_EMAIL}
            </a>
            <span className="text-sm text-gray-600">{COMPANY_INFO.CONTACT_PHONE}</span>
          </div>
          <span className="text-xs text-gray-400 mt-6 block">&copy; {new Date().getFullYear()} {COMPANY_INFO.NAME}</span>
        </div>
      </footer>
    </main>
  );
}
