'use client';

import { useState, useEffect } from 'react';
import { GridProps } from '@/types';
import GridContainer from '@/components/GridContainer';
import { GRID_CONFIG, PRICING, COMPANY_INFO } from '@/lib/constants';
import Image from 'next/image';

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
            className="w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      {/* Header */}
      <header className={`w-full bg-white border-b border-gray-100 py-5 px-6 sticky top-0 z-40 backdrop-blur-sm bg-white/90 transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image 
              src={COMPANY_INFO.LOGO} 
              alt={COMPANY_INFO.NAME} 
              width={120} 
              height={40} 
              className="h-8 w-auto"
              priority
            />
            <h1 className="text-xl font-medium tracking-tight">1000 Grid Spaces</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">About</a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">How It Works</a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Contact</a>
            <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`w-full bg-white py-16 px-6 border-b border-gray-100 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            1000 Grid Spaces
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Lease your piece of digital real estate in our curated grid collection
          </p>
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium">
              Browse Available Spaces
            </button>
            <button className="px-6 py-3 bg-white text-black border border-gray-200 rounded-md hover:bg-gray-50 transition-colors font-medium">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Grid Container */}
      <section className="w-full overflow-hidden bg-white py-6">
        <div className="max-w-full mx-auto flex justify-center">
          <GridContainer
            grids={grids}
            containerSize={GRID_CONFIG.TOTAL_GRIDS}
            columns={GRID_CONFIG.BREAKPOINTS.lg.columns}
            onPurchaseClick={handlePurchaseClick}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-100 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <Image 
                src={COMPANY_INFO.LOGO} 
                alt={COMPANY_INFO.NAME} 
                width={100} 
                height={30} 
                className="h-8 w-auto mr-3"
              />
              <span className="text-lg font-medium">{COMPANY_INFO.NAME}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              A digital marketplace for unique grid spaces that you can customize with your content.
            </p>
            <span className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {COMPANY_INFO.NAME}</span>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Resources</h3>
            <div className="flex flex-col space-y-2">
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">How It Works</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">Pricing</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">FAQ</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">Terms of Service</a>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Contact</h3>
            <div className="flex flex-col space-y-2">
              <a href={`mailto:${COMPANY_INFO.CONTACT_EMAIL}`} className="text-sm text-gray-600 hover:text-black transition-colors">
                {COMPANY_INFO.CONTACT_EMAIL}
              </a>
              <span className="text-sm text-gray-600">{COMPANY_INFO.CONTACT_PHONE}</span>
            </div>
            <div className="flex space-x-4 mt-4">
              <a href={COMPANY_INFO.SOCIAL.FACEBOOK} className="text-gray-400 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href={COMPANY_INFO.SOCIAL.TWITTER} className="text-gray-400 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href={COMPANY_INFO.SOCIAL.INSTAGRAM} className="text-gray-400 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
