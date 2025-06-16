import { useState, useEffect, useRef, useCallback } from 'react';

// Generic hook for using localStorage with any type of data
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store the value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue if null
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Keep a stable reference to the key and initialValue
  const keyRef = useRef(key);
  const initialValueRef = useRef(initialValue);
  
  // Update refs if props change
  useEffect(() => {
    keyRef.current = key;
    initialValueRef.current = initialValue;
  }, [key, initialValue]);
  
  // Memoize setValue to keep a consistent reference
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function for same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${keyRef.current}":`, error);
    }
  }, [storedValue]);
  
  return [storedValue, setValue] as const;
}

// Specific hook for user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useLocalStorage('user_preferences', {
    theme: 'system', // 'light', 'dark', or 'system'
    backgroundType: 'particles', // 'particles', 'video', or 'none'
    gridSize: 'medium', // 'small', 'medium', or 'large'
  });
  
  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  }, [preferences, setPreferences]);
  
  return {
    preferences,
    updatePreference,
  };
}

// Hook for recent interactions
export function useRecentInteractions() {
  const [interactions, setInteractions] = useLocalStorage('recent_interactions', {
    recentlyViewedGrids: [] as string[],
    lastVisitedPage: '/',
  });
  
  // Add a grid to recently viewed
  const addRecentlyViewedGrid = useCallback((gridId: string) => {
    setInteractions((prev) => {
      // Remove if already exists to prevent duplicates
      const existing = prev.recentlyViewedGrids.filter(id => id !== gridId);
      // Add to the beginning and limit to 10 items
      return {
        ...prev,
        recentlyViewedGrids: [gridId, ...existing].slice(0, 10),
      };
    });
  }, [setInteractions]);
  
  // Update last visited page
  const updateLastVisitedPage = useCallback((path: string) => {
    setInteractions((prev) => ({
      ...prev,
      lastVisitedPage: path,
    }));
  }, [setInteractions]);
  
  return {
    recentlyViewedGrids: interactions.recentlyViewedGrids,
    lastVisitedPage: interactions.lastVisitedPage,
    addRecentlyViewedGrid,
    updateLastVisitedPage,
  };
} 