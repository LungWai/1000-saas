import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';

/**
 * Component that renders a particle background that changes based on theme
 * that is visible throughout the entire page including the hero section
 */
export default function ParticlesBackground() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Get current theme (accounting for system theme)
  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  // Initialize after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Particles initialization
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);
  
  // Define particles options for light theme
  const lightThemeOptions = {
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60,
    particles: {
      color: {
        value: "#6366f1", // Indigo color for light theme
      },
      links: {
        color: "#a5b4fc",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        enable: true,
        random: true,
        speed: 1.15, // Increased by 15%
        direction: "none" as const,
        outModes: {
          default: "bounce" as const,
        },
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 60,
      },
      opacity: {
        value: 0.4,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1.15, max: 3.45 }, // Increased by 15%
      },
    },
    detectRetina: true,
  };
  
  // Define particles options for dark theme
  const darkThemeOptions = {
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60,
    particles: {
      color: {
        value: "#94a3b8", // Slate color for dark theme
      },
      links: {
        color: "#64748b",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        enable: true,
        random: true,
        speed: 1.15, // Increased by 15%
        direction: "none" as const,
        outModes: {
          default: "bounce" as const,
        },
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 60,
      },
      opacity: {
        value: 0.4,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1.15, max: 3.45 }, // Increased by 15%
      },
    },
    detectRetina: true,
  };
  
  if (!mounted) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={currentTheme === 'dark' ? darkThemeOptions : lightThemeOptions}
      />
    </div>
  );
} 