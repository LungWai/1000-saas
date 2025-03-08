import { useEffect, useState, createContext, useContext } from 'react';
import ParticlesBackground from './ParticlesBackground';
import VideoBackground from './VideoBackground';

// Create a context for background refresh
interface BackgroundContextType {
  refreshBackground: () => void;
}

export const BackgroundContext = createContext<BackgroundContextType>({
  refreshBackground: () => {},
});

// Custom hook for using the background context
export const useBackground = () => useContext(BackgroundContext);

/**
 * Component that randomly selects between different background types
 * with two-step random logic:
 * 1. First randomly choose between particle or video
 * 2. If video is chosen, randomly select one of the available videos
 */
export default function BackgroundManager() {
  const [backgroundType, setBackgroundType] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Function to trigger a background refresh
  const refreshBackground = () => {
    // Clear the selection from localStorage
    localStorage.removeItem('backgroundLastSelection');
    
    // Increment the refresh trigger to force a re-render
    setRefreshTrigger(prev => prev + 1);
    
    // Reset background type to force new selection
    setBackgroundType(null);
  };
  
  useEffect(() => {
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
  
  if (!backgroundType) return null;
  
  return (
    <BackgroundContext.Provider value={{ refreshBackground }}>
      {backgroundType === 'particles' && <ParticlesBackground />}
      {backgroundType === 'video' && <VideoBackground />}
    </BackgroundContext.Provider>
  );
} 