import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import ParticlesBackground from './ParticlesBackground';
import VideoBackground from './VideoBackground';

// Create a context for background refresh
interface BackgroundContextType {
  refreshBackground: () => void;
  currentBackgroundType: string | null;
}

const defaultContextValue: BackgroundContextType = {
  refreshBackground: () => {
    console.log("Default refresh function called - context not yet initialized");
  },
  currentBackgroundType: null
};

export const BackgroundContext = createContext<BackgroundContextType>(defaultContextValue);

// Custom hook for using the background context
export const useBackground = () => useContext(BackgroundContext);

interface BackgroundManagerProps {
  children?: ReactNode;
}

/**
 * Component that randomly selects between different background types
 * with two-step random logic:
 * 1. First randomly choose between particle or video
 * 2. If video is chosen, randomly select one of the available videos
 */
export default function BackgroundManager({ children }: BackgroundManagerProps) {
  const [backgroundType, setBackgroundType] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Function to trigger a background refresh - using useCallback to maintain reference stability
  const refreshBackground = useCallback(() => {
    console.log("Refresh background triggered");
    
    // Force a new selection by incrementing the refresh trigger
    setRefreshTrigger(prev => prev + 1);
    
    // This will trigger the useEffect to run again and select a new background
  }, []);
  
  useEffect(() => {
    console.log("Effect running with refresh trigger:", refreshTrigger);
    
    // Available background types
    const backgroundTypes = ['particles', 'video'];
    
    // Step 1: Select a random background type
    const randomIndex = Math.floor(Math.random() * backgroundTypes.length);
    const selectedType = backgroundTypes[randomIndex];
    
    // Set the selected background type
    setBackgroundType(selectedType);
    
    // For debugging - log the selected type
    console.log('Selected background type:', selectedType);
    
  }, [refreshTrigger]);
  
  // Create a context value object
  const contextValue = {
    refreshBackground,
    currentBackgroundType: backgroundType
  };
  
  return (
    <BackgroundContext.Provider value={contextValue}>
      {backgroundType === 'particles' && <ParticlesBackground key={refreshTrigger} />}
      {backgroundType === 'video' && <VideoBackground key={refreshTrigger} />}
      {children}
    </BackgroundContext.Provider>
  );
} 