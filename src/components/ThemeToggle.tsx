'use client';

import { useTheme } from '@/lib/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Only show the toggle after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleToggle = () => {
    toggleTheme();
  };
  
  if (!mounted) return null;
  
  return (
    <button
      onClick={handleToggle}
      className="relative w-12 h-6 rounded-full bg-muted flex items-center transition-colors duration-300 focus:outline-none border border-border"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      <span 
        className={`absolute transform transition-transform duration-300 flex items-center justify-center w-5 h-5 rounded-full ${
          theme === 'light' 
            ? 'bg-white translate-x-6 text-black' 
            : 'bg-gray-800 translate-x-1 text-white'
        }`}
      >
        {theme === 'light' ? (
          <Sun className="h-3 w-3" />
        ) : (
          <Moon className="h-3 w-3" />
        )}
      </span>
    </button>
  );
} 