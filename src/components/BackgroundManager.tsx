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

// Probability configuration
const PROBABILITY = {
  VIDEO: 0.7,  // 30% chance for video
  PARTICLES: 0.3  // 70% chance for particles
};

/**
 * Component that selects between different background types
 * with weighted probability:
 * - 30% chance for particles
 * - 70% chance for video/image backgrounds
 */
export default function BackgroundManager({ children }: BackgroundManagerProps) {
  const [backgroundType, setBackgroundType] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Function to trigger a background refresh - using useCallback to maintain reference stability
  const refreshBackground = useCallback(() => {
    console.log("Refresh background triggered");
    setRefreshTrigger((prev: number) => prev + 1);
  }, []);
  
  useEffect(() => {
    console.log("Effect running with refresh trigger:", refreshTrigger);
    
    // Generate a random number between 0 and 1
    const randomValue = Math.random();
    
    // If random value is less than VIDEO probability (0.3), choose video, otherwise particles
    const selectedType = randomValue < PROBABILITY.VIDEO ? 'video' : 'particles';
    
    // Set the selected background type
    setBackgroundType(selectedType);
    
    // For debugging - log the selected type and probability
    console.log('Selected background type:', selectedType, '(random value:', randomValue, ')');
    
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