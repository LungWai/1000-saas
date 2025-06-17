'use client';

import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { GridProps } from '@/types';
import { GRID_CONFIG, PRICING, COMPANY_INFO } from '@/lib/constants';
import Image from 'next/image';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import ThemeToggle from '@/components/ThemeToggle';
import BackgroundManager, { useBackground } from '@/components/BackgroundManager';
import Link from 'next/link';
import { useGrids } from '@/hooks/useGrids';
import { useUserPreferences, useRecentInteractions } from '@/hooks/useLocalStorage';
import GridSkeleton from '@/components/GridSkeleton';
import useToastNotification from '@/hooks/useToastNotification';

// Lazy load components that aren't needed for initial render
const GridContainer = lazy(() => import('@/components/GridContainer'));

// Create a wrapper component to ensure context is available
function BackgroundProvider({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundManager>
      {children}
    </BackgroundManager>
  );
}

export default function Home() {
  const { grids, isLoading, isError, error, fetchAllGrids, refreshGrids } = useGrids();
  const [headerVisible, setHeaderVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const { toast } = useToast();
  const toastNotification = useToastNotification();
  const { updateLastVisitedPage } = useRecentInteractions();
  const { preferences } = useUserPreferences();
  
  // Use a ref to track first render
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Only update the last visited page on the first render
    if (isFirstRender.current) {
      updateLastVisitedPage('/');
      isFirstRender.current = false;
    }
    
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
  }, [updateLastVisitedPage]); // Keep in dependency array for consistency

  const handlePurchaseClick = (gridId: string) => {
    // Find the grid by ID to get its title
    const selectedGrid = grids.find(grid => grid.id === gridId);
    const gridTitle = selectedGrid?.title || `Grid #${gridId}`;
    
    // Use the custom toast notification
    toastNotification.showInfo(`You selected ${gridTitle}. Proceeding to purchase...`, "Grid Selected");
    console.log(`Purchase clicked for grid: ${gridId}`);
  };

  // Add onPurchaseClick to grid objects
  const gridsWithHandlers = grids.map(grid => ({
    ...grid,
    onPurchaseClick: () => handlePurchaseClick(grid.id)
  }));

  if (isLoading) {
    return (
      <BackgroundProvider>
        <main className="min-h-screen flex-col text-foreground relative z-10">
          {/* Header */}
          <header className={`w-full bg-card/40 border-b border-border py-5 backdrop-blur-sm transition-all duration-500 relative z-50 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="max-w-[1200px] w-full mx-auto px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/">
                    <Image 
                      src="/logo.png" 
                      alt="Logo" 
                      width={96} 
                      height={96} 
                      className="h-16 w-auto"
                      priority
                    />
                  </Link>
                  <Link href="/" className="hover:opacity-80 transition-opacity">
                    <h1 className="text-3xl font-medium tracking-tight">1000 SaaS Space</h1>
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <RefreshBackgroundButton />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          {/* Loading state with skeleton */}
          <section className="w-full overflow-hidden bg-transparent py-12">
            <div className="w-full max-w-[1500px] mx-auto">
              <GridSkeleton 
                count={GRID_CONFIG.TOTAL_GRIDS} 
                columns={GRID_CONFIG.BREAKPOINTS.lg.columns} 
              />
            </div>
          </section>
        </main>
      </BackgroundProvider>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error?.message || 'Failed to load grids'}</AlertDescription>
          <Button 
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              toastNotification.showInfo("Trying to reload grid data...");
              refreshGrids();
            }}
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <BackgroundProvider>
      <main className="min-h-screen flex-col text-foreground relative z-10">
        {/* Header */}
        <header className={`w-full bg-card/40 border-b border-border py-5 backdrop-blur-sm transition-all duration-500 relative z-50 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="max-w-[1200px] w-full mx-auto px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/">
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    width={96} 
                    height={96} 
                    className="h-16 w-auto"
                    priority
                  />
                </Link>
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-3xl font-medium tracking-tight">1000 SaaS Space</h1>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <RefreshBackgroundButton />
                <ThemeToggle />
                <NavigationMenu className="hidden md:block">
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" href="/about">
                        About
                      </NavigationMenuLink>
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
        <section className={`w-full transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[800px] mx-auto px-8 text-center py-5">
            <div className="bg-card/20 backdrop-blur-md rounded-lg p-6">
              <h2 className="text-2xl font-bold tracking-tight mb-3 text-foreground">Explore Premium Space for SaaS advertising</h2>
              <p className="text-base text-foreground leading-relaxed max-w-[400px] mx-auto">
                We allocated 80% of our subscription revenue to advertising on social media platforms, including YouTube, Meta, X, and TikTok.              </p>
            </div>
          </div>
        </section>

        {/* Grid Container */}
        <section className="w-full overflow-hidden bg-transparent py-12">
          <div className="w-full max-w-[1500px] mx-auto">
            <Suspense fallback={
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }>
              <GridContainer
                grids={gridsWithHandlers}
                containerSize={GRID_CONFIG.TOTAL_GRIDS}
                columns={GRID_CONFIG.BREAKPOINTS.lg.columns}
                onPurchaseClick={handlePurchaseClick}
              />
            </Suspense>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="w-full bg-card/40 border-t border-border py-16 backdrop-blur-sm">
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
      </main>
      <Toaster />
    </BackgroundProvider>
  );
}

// Refresh Background Button Component
function RefreshBackgroundButton() {
  const backgroundContext = useBackground();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple clicks
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log("Refresh button clicked, current type:", backgroundContext.currentBackgroundType);
    
    // Call the refresh function from context
    backgroundContext.refreshBackground();
    
    // Reset the refreshing state after animation completes
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        className={`relative ${isRefreshing ? 'bg-primary/20' : ''}`}
        aria-label="Refresh background"
        title="Refresh background"
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
      </Button>
      {isRefreshing && (
        <span className="absolute top-full left-1/2 transform -translate-x-1/2 text-xs text-primary animate-pulse mt-1">
          Refreshing...
        </span>
      )}
    </div>
  );
}
