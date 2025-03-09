"use client"

import type React from 'react';
import { MouseEvent, useEffect, useState } from 'react';
import { GridHoverOverlayProps, GridProps } from '@/types';
import { useTheme } from '@/lib/ThemeProvider';

interface ExtendedGridHoverOverlayProps extends GridHoverOverlayProps, GridProps {
  isLoading?: boolean;
}

const GridHoverOverlay: React.FC<ExtendedGridHoverOverlayProps> = ({
  id,
  status,
  price,
  imageUrl,
  title,
  description,
  externalUrl,
  isVisible,
  isLoading = false,
  onPurchaseClick,
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!isVisible || !mounted) return null;
  
  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      onPurchaseClick(id);
    }
  };
  
  const isDarkMode = theme === 'dark';
  
  return (
    <>
      {/* Title at top left and Status at top right - reduced by 35% */}
      <div style={{ 
        position: 'absolute', 
        top: 0,
        left: 0,
        padding: '1px',
        zIndex: 60,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        {/* Title - reduced by 35% */}
        {title && (
          <div style={{ 
            fontSize: '0.16rem',
            padding: '0.5px 1px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            borderRadius: '1px',
            maxWidth: '60%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </div>
        )}
        
        {/* Status - reduced by 35% */}
        {status && (
          <div style={{ 
            fontSize: '0.16rem',
            padding: '0.5px 1px',
            background: isDarkMode ? 'rgba(40, 40, 40, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            color: isDarkMode ? 'white' : 'black',
            borderRadius: '1px',
          }}>
            {status}
          </div>
        )}
      </div>
      
      {/* Refined bottom legend with price and button - reduced by 15% */}
      <div className="grid-hover-overlay">
        {/* Price section with better alignment - reduced by 15% */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="grid-hover-price" style={{ fontSize: '0.34rem', fontWeight: 500 }}>
            ${price}
          </span>
          <span className="grid-hover-month" style={{ fontSize: '0.25rem', marginLeft: '1px' }}>
            /month
          </span>
        </div>
        
        {/* Button with better sizing - reduced by 15% */}
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          className="grid-hover-button"
          style={{
            fontSize: '0.25rem',
            padding: '1px 3px',
            borderRadius: '2px',
            height: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            minWidth: '24px',
            fontWeight: 600,
          }}
          title={`Lease ${title || `Grid #${id}`}`}
        >
          {isLoading ? (
            <div style={{ fontSize: "0.25rem", display: "flex", alignItems: "center" }}>
              <div style={{ 
                width: "0.17rem", 
                height: "0.17rem", 
                borderTop: `1px solid currentColor`, 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite" 
              }}></div>
              <span style={{ marginLeft: "0.1rem" }}>...</span>
            </div>
          ) : (
            <span style={{ letterSpacing: '0.02rem' }}>Lease Grid</span>
          )}
        </button>
      </div>
    </>
  );
};

export default GridHoverOverlay; 