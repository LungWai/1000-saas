"use client"

import type React from 'react';
import { GridProps } from '@/types';
import GridHoverOverlay from './GridHoverOverlay';
import { GRID_CONFIG } from '@/lib/constants';
import { CSSProperties, MouseEvent, useState, useEffect, useRef } from 'react';

interface ExtendedGridProps extends GridProps {
  isLoading?: boolean;
  style?: CSSProperties;
  getTransformOrigin?: () => string;
  onHoverStateChange?: (id: string, isHovered: boolean, element?: HTMLElement) => void;
}

const GridItem: React.FC<ExtendedGridProps> = ({
  id,
  status,
  price,
  imageUrl,
  title,
  description,
  externalUrl,
  onPurchaseClick,
  isLoading = false,
  style = {},
  getTransformOrigin,
  onHoverStateChange,
}) => {
  const isEmpty = status === 'empty';
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Debounce hover events to prevent rapid state changes
  const HOVER_DEBOUNCE_MS = 150;

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    // Don't show hover effects if modal is open
    if (document.body.classList.contains('modal-open')) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      if (onHoverStateChange) {
        onHoverStateChange(id, true, e.currentTarget);
      }
    }, HOVER_DEBOUNCE_MS);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      if (onHoverStateChange) {
        onHoverStateChange(id, false);
      }
    }, HOVER_DEBOUNCE_MS);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle keyboard focus for accessibility
  const handleFocus = () => {
    // Don't show hover effects if modal is open
    if (document.body.classList.contains('modal-open')) return;
    
    setIsHovered(true);
    if (onHoverStateChange && gridRef.current) {
      onHoverStateChange(id, true, gridRef.current);
    }
  };

  const handleBlur = () => {
    setIsHovered(false);
    if (onHoverStateChange) {
      onHoverStateChange(id, false);
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = () => {
    // Don't show hover effects if modal is open
    if (document.body.classList.contains('modal-open')) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      if (onHoverStateChange && gridRef.current) {
        onHoverStateChange(id, true, gridRef.current);
      }
    }, HOVER_DEBOUNCE_MS);
  };

  const handleTouchEnd = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      if (onHoverStateChange) {
        onHoverStateChange(id, false);
      }
    }, HOVER_DEBOUNCE_MS);
  };

  const transformOrigin = getTransformOrigin ? getTransformOrigin() : 'center center';

  return (
    <div
      ref={gridRef}
      className={`
        relative
        border
        border-border
        overflow-hidden
        transition-all
        duration-300
        ${isHovered ? `z-[100]` : 'z-10'}
        outline-none
        focus:ring-2
        focus:ring-primary
        focus:ring-offset-2
        focus:ring-offset-background
        backdrop-blur-sm
        bg-card/30
        rounded-md
        p-1
        ${isEmpty ? 'cursor-default bg-muted/20' : 'cursor-pointer hover:shadow-lg'}
        ${isLoading === id ? 'pointer-events-none' : ''}
      `}
      style={{
        aspectRatio: '1 / 1',
        willChange: 'transform',
        transform: isHovered ? `scale(${GRID_CONFIG.HOVER_SCALE})` : 'scale(1)',
        transformOrigin,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="button"
      aria-label={`Grid ${id}`}
      data-grid-id={id}
      data-grid-status={status}
      data-hovered={isHovered ? "true" : "false"}
    >
      <div
        className={`relative w-full h-full border border-gray-300 overflow-hidden ${
          isHovered ? 'shadow-lg' : ''
        }`}
        style={{ 
          backgroundColor: 'rgba(128, 128, 128, 0.15)',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {!isEmpty && (
          <>
            {imageUrl && (
              <img
                src={imageUrl}
                alt={title || 'Grid content'}
                className="w-full h-full object-cover"
              />
            )}
            {title && (
              <div className="absolute bottom-0 left-0 right-0 bg-white/80 p-2 z-20">
                <p className="text-black text-xs truncate">{title}</p>
              </div>
            )}
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </>
        )}
        
        {/* Render overlay directly within the grid */}
        {isHovered && (
          <div className="absolute inset-0 z-50">
            <GridHoverOverlay
              {...{ id, status, price, imageUrl, title, description, externalUrl }}
              isVisible={true}
              isLoading={isLoading}
              onPurchaseClick={() => onPurchaseClick(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GridItem; 