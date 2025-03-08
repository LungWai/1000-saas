'use client';

import { useState, useEffect } from 'react';
import { GridProps } from '@/types';
import GridContainer from '@/components/GridContainer';
import { GRID_CONFIG, PRICING, COMPANY_INFO } from '@/lib/constants';
import Image from 'next/image';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import ThemeToggle from '@/components/ThemeToggle';
import ParticlesBackground from '@/components/ParticlesBackground';

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
  const { toast } = useToast();

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
    toast({
      title: "Grid Selected",
      description: `You selected grid ${gridId}. Proceeding to purchase...`,
    });
    console.log(`Purchase clicked for grid: ${gridId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading grid spaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button 
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchGrids();
            }}
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex-col bg-background text-foreground">
      {/* Particles Background */}
      <ParticlesBackground />
      
      {/* Header */}
      <header className={`w-full bg-card/90 border-b border-border py-5 z-40 backdrop-blur-sm transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-[1200px] w-full mx-auto px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Image 
                src="/logo.png"
                alt="Logo"
                width={96}
                height={96}
                className="h-16 w-auto"
                priority
              />
              <h1 className="text-3xl font-medium tracking-tight">1000 SaaS Space</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>About</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-4 w-[400px]">
                        <h4 className="text-sm font-medium leading-none mb-2">About Us</h4>
                        <p className="text-sm text-muted-foreground">Your digital real estate marketplace for the future of SaaS.</p>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" href="#contact">
                      Contact
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`w-full bg-gradient-to-b from-card to-muted py-5 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3"> Discover Your SaaS Space </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[400px] mx-auto">
            Explore premium digital real estate tailored for SaaS advertising
          </p>
        </div>
      </section>

      {/* Grid Container */}
      <section className="w-full overflow-hidden bg-background py-12">
        <div className="w-full max-w-[1200px] mx-auto px-8">
          <GridContainer
            grids={grids}
            containerSize={GRID_CONFIG.TOTAL_GRIDS}
            columns={GRID_CONFIG.BREAKPOINTS.lg.columns}
            onPurchaseClick={handlePurchaseClick}
          />
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="w-full bg-card border-t border-border py-16">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Contact</h3>
              <div className="space-y-3">
                <a href={`mailto:${COMPANY_INFO.CONTACT_EMAIL}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                  {COMPANY_INFO.CONTACT_EMAIL}
                </a>
                <span className="text-sm text-muted-foreground block">{COMPANY_INFO.CONTACT_PHONE}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Company</h3>
              <div className="space-y-3">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">About Us</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">Terms of Service</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">Privacy Policy</a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Social</h3>
              <div className="space-y-3">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">Twitter</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border">
            <span className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {COMPANY_INFO.NAME}. All rights reserved.</span>
          </div>
        </div>
      </footer>
      <Toaster />
    </main>
  );
}
