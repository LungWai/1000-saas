'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default light theme
  const [theme, setTheme] = useState<Theme>('light');
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle initial theme determination on client-side only
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Check if theme is stored or should be based on time
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    } else {
      // If no stored theme, use time-based theme
      const currentHour = new Date().getHours();
      const isDayTime = currentHour >= 6 && currentHour < 20; // 6 AM to 8 PM
      setTheme(isDayTime ? 'light' : 'dark');
    }
    
    setIsMounted(true);
  }, []);
  
  // Apply theme to document element whenever theme changes
  useEffect(() => {
    if (!isMounted) return;
    
    const root = document.documentElement;
    
    // Add or remove dark class based on theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme preference
    localStorage.setItem('theme', theme);
    
    // Apply transition class for smooth theme changes
    root.classList.add('theme-transition');
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 500);
    
  }, [theme, isMounted]);
  
  // Toggle between light and dark
  const toggleTheme = () => {
    localStorage.setItem('userThemePreference', 'true');
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Provide context value
  const contextValue = {
    theme,
    setTheme,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 