"use client"

import type React from 'react';
import { MouseEvent } from 'react';
import { GridHoverOverlayProps, GridProps } from '@/types';

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
  if (!isVisible) return null;
  
  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      onPurchaseClick(id);
    }
  };
  
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
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '1px',
          }}>
            {status}
          </div>
        )}
      </div>
      
      {/* Refined bottom legend with price and button - reduced by 15% */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 3px',
        zIndex: 50,
        pointerEvents: 'auto',
      }}>
        {/* Price section with better alignment - reduced by 15% */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="grid-hover-price" style={{ fontSize: '0.34rem', fontWeight: 500 }}>${price}</span>
          <span className="grid-hover-month" style={{ fontSize: '0.25rem', color: '#666', marginLeft: '1px' }}>/month</span>
        </div>
        
        {/* Button with better sizing - reduced by 15% */}
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          style={{
            background: '#000',
            color: 'white',
            fontSize: '0.25rem',
            padding: '1px 3px',
            borderRadius: '2px',
            height: '10px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          {isLoading ? (
            <div style={{ fontSize: "0.25rem", display: "flex", alignItems: "center" }}>
              <div style={{ width: "0.17rem", height: "0.17rem", borderTop: "1px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <span style={{ marginLeft: "0.1rem" }}>...</span>
            </div>
          ) : (
            'Lease Grid'
          )}
        </button>
      </div>
    </>
  );
};

export default GridHoverOverlay; 