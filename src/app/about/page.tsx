'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import ThemeToggle from '@/components/ThemeToggle';
import BackgroundManager, { useBackground } from '@/components/BackgroundManager';
import { COMPANY_INFO } from '@/lib/constants';

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

export default function About() {
  const [headerVisible, setHeaderVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    // Add animation for header and hero
    const headerTimer = setTimeout(() => {
      setHeaderVisible(true);
    }, 100);
    
    const heroTimer = setTimeout(() => {
      setHeroVisible(true);
    }, 300);
    
    const contentTimer = setTimeout(() => {
      setContentVisible(true);
    }, 500);
    
    return () => {
      clearTimeout(headerTimer);
      clearTimeout(heroTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <BackgroundManager>
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
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" href="/#contact">
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
        <section className={`w-full py-8 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[800px] mx-auto px-4">
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-2xl font-bold tracking-tight mb-3 text-foreground">About 1000 SaaS Space</h2>
              <p className="text-base text-foreground/80 leading-relaxed max-w-[600px] mx-auto">
                Your digital billboard in the SaaS ecosystem. Premium advertising space where innovative software solutions meet their ideal audience.
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className={`w-full py-6 transition-all duration-700 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[800px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-5 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Grid Digital Real Estate</h3>
                <p className="text-foreground/80 leading-snug text-sm">
                  Own a piece of prime digital real estate in our innovative grid marketplace. Each space is a unique opportunity to showcase your SaaS product to a targeted audience.
                </p>
              </div>
              
              <div className="bg-card rounded-lg p-5 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Concentrated Traffic</h3>
                <p className="text-foreground/80 leading-snug text-sm">
                  Direct exposure to qualified leads through our strategic presence on YouTube, TikTok, and Meta. Your SaaS solution, front and center where it matters.
                </p>
              </div>
              
              <div className="bg-card rounded-lg p-5 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Grow Your Business</h3>
                <p className="text-foreground/80 leading-snug text-sm">
                  Amplify your reach in our curated marketplace. Join a community of innovative SaaS solutions and connect with users actively seeking new software solutions.
                </p>
              </div>
              
              <div className="bg-card rounded-lg p-5 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Claim Your Space</h3>
                <p className="text-foreground/80 leading-snug text-sm">
                  Limited spaces available in this exclusive digital ecosystem. Secure your position now and maximize your visibility in the growing SaaS marketplace.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                Explore Available Spaces
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-card/40 border-t border-border py-8 backdrop-blur-sm mt-8">
          <div className="max-w-[800px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">Contact</h3>
                <div className="space-y-1">
                  <a href={`mailto:${COMPANY_INFO.CONTACT_EMAIL}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                    {COMPANY_INFO.CONTACT_EMAIL}
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">Links</h3>
                <div className="space-y-1">
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                    Home
                  </Link>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                    About
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">Legal</h3>
                <div className="space-y-1">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                    Terms of Service
                  </Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} 1000 SaaS Space. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </BackgroundManager>
  );
} 