import useSWR from 'swr';
import { GridProps, GridResponse } from '@/types';
import { PRICING } from '@/lib/constants';

/**
 * Natural sort algorithm for grid IDs
 * This ensures that 1, 2, 3, ... 10, 11 sort correctly
 */
function naturalSort(a: string, b: string): number {
  // If both are numeric strings, compare as numbers
  const aMatch = a.match(/^(\d+)$/);
  const bMatch = b.match(/^(\d+)$/);
  
  if (aMatch && bMatch) {
    return parseInt(aMatch[1]) - parseInt(bMatch[1]);
  }
  
  // Extract numeric portions for natural sorting
  const ax = a.toString().replace(/(\d+)/g, (m) => m.padStart(10, '0'));
  const bx = b.toString().replace(/(\d+)/g, (m) => m.padStart(10, '0'));
  
  return ax.localeCompare(bx);
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch grid data');
    error.message = await res.text();
    throw error;
  }
  return res.json();
};

// Format grid response data to match GridProps
const formatGridData = (grids: GridResponse[]): GridProps[] => {
  if (!grids || grids.length === 0) return [];

  // Apply natural sort to grid IDs only
  const sortedGrids = [...grids].sort((a, b) => {
    // Only sort by ID, not by status or any other property
    return naturalSort(a.id, b.id);
  });

  return sortedGrids.map((grid: GridResponse) => {
    // Validate and fix image URL if needed
    let validImageUrl = grid.image_url;
    
    // Check if URL is valid
    if (validImageUrl) {
      // If URL doesn't start with http or /, it might be a relative URL or invalid
      if (!validImageUrl.startsWith('http') && !validImageUrl.startsWith('/')) {
        // Try to fix by adding a leading slash if it's a relative path
        if (!validImageUrl.startsWith('./')) {
          validImageUrl = '/' + validImageUrl;
        }
      }
      
      // If URL is from Supabase storage but missing the base URL
      if (validImageUrl.includes('storage/v1/object/public/')) {
        // Add the Supabase URL if it's missing
        if (!validImageUrl.startsWith('http')) {
          validImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}${validImageUrl}`;
        }
        
        // Create a proxy URL to avoid CORS issues
        const pathMatch = validImageUrl.match(/public\/([^?]+)/);
        if (pathMatch && pathMatch[1]) {
          // Use our proxy endpoint instead of direct Supabase URL
          validImageUrl = `/api/images/proxy?path=${encodeURIComponent(pathMatch[1])}`;
        }
      }
    }
    
    return {
      id: grid.id.toString(),
      status: grid.status === 'active' ? 'leased' : 'empty',
      price: typeof grid.price === 'number' ? grid.price : PRICING.BASE_PRICE,
      imageUrl: validImageUrl,
      title: grid.title,
      description: grid.description,
      externalUrl: grid.external_url,
      content: grid.content,
    };
  });
};

// Main hook for fetching all grids with pagination
export function useGrids() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/grids?page=1&limit=1000', // Increase limit to ensure all grids are fetched
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );
  
  // Fetch all pages if needed
  const fetchAllGrids = async () => {
    if (!data) return [];
    
    let allGrids = [...data.grids];
    const totalPages = data.totalPages;
    
    // Fetch remaining pages if needed
    for (let page = 2; page <= totalPages; page++) {
      try {
        const response = await fetch(`/api/grids?page=${page}&limit=1000`); // Increased limit
        const pageData = await response.json();
        
        if (!response.ok) continue;
        
        allGrids = [...allGrids, ...pageData.grids];
      } catch (err) {
        console.error(`Error fetching page ${page}:`, err);
      }
    }
    
    return formatGridData(allGrids);
  };
  
  // Get formatted grid data
  const formattedGrids = data ? formatGridData(data.grids) : [];
  
  return {
    grids: formattedGrids,
    isLoading,
    isError: !!error,
    error,
    totalGrids: data?.total || 0,
    fetchAllGrids,
    refreshGrids: mutate
  };
}

// Hook for fetching a single grid by ID
export function useGrid(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/grids/${id}` : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );
  
  const formattedGrid = data ? formatGridData([data.grid])[0] : null;
  
  return {
    grid: formattedGrid,
    isLoading,
    isError: !!error,
    error,
    refreshGrid: mutate
  };
}

// Export a helper to prefetch grid data
export function prefetchGrids() {
  return fetcher('/api/grids?page=1&limit=200');
} 