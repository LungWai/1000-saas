"use client"

import type React from 'react';
import { GridProps, EditAccess } from '@/types';
import GridHoverOverlay from './GridHoverOverlay';
import { GRID_CONFIG } from '@/lib/constants';
import { CSSProperties, MouseEvent, useState, useEffect, useRef } from 'react';
import EditModal from './EditModal';

interface ExtendedGridProps extends GridProps {
  isLoading?: boolean;
  style?: CSSProperties;
  getTransformOrigin?: () => string;
  onHoverStateChange?: (id: string, isHovered: boolean, element?: HTMLElement) => void;
  content?: string | null;
}

const GridItem: React.FC<ExtendedGridProps> = ({
  id,
  status,
  price,
  imageUrl,
  title,
  description,
  externalUrl,
  content,
  onPurchaseClick,
  isLoading = false,
  style = {},
  getTransformOrigin,
  onHoverStateChange,
}) => {
  const isEmpty = status === 'empty';
  const isLeased = status === 'leased';
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Safety check for content to prevent rendering issues
  const hasValidContent = (): boolean => {
    if (!content) return false;
    if (content === '{}') return false;
    if (typeof content === 'object' && Object.keys(content).length === 0) return false;
    return true;
  };
  
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

  const handleGridAction = (gridId: string) => {
    if (isLeased) {
      // Open edit modal for leased grids
      setIsEditModalOpen(true);
    } else {
      // Call purchase action for empty grids
      onPurchaseClick(gridId);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    
    // Force reset of all hover and expansion states
    setIsHovered(false);
    
    // Reset the grid's hover and z-index state
    if (gridRef.current) {
      // Force reset to default styles with !important to override any transitions
      gridRef.current.setAttribute('style', `
        z-index: 10 !important;
        transform: scale(1) !important;
        transform-origin: center center !important;
        transition: none !important;
      `);
      
      // Then restore the original styles without the override
      setTimeout(() => {
        if (gridRef.current) {
          gridRef.current.setAttribute('style', `
            z-index: 10;
            transform: scale(1);
            transform-origin: center center;
          `);
        }
      }, 50);
      
      // Reset the data-hovered attribute
      gridRef.current.setAttribute('data-hovered', 'false');
      
      // Remove any classes that might be affecting the display
      gridRef.current.classList.remove('z-[100]');
      
      // Force a repaint to ensure styles are applied
      void gridRef.current.offsetWidth;
    }
    
    // Notify parent that hover state has changed
    if (onHoverStateChange) {
      onHoverStateChange(id, false);
    }
    
    // Delay any new hover effects to prevent immediate re-hover
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      // Allow hover events again after a delay
      if (gridRef.current) {
        gridRef.current.style.pointerEvents = 'auto';
      }
    }, 500); // Slightly longer delay to prevent accidental immediate hover
  };

  const handleEditModalSubmit = async (data: EditAccess) => {
    try {
      // Submit edit data to server
      const response = await fetch(`/api/grids/${id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Try to parse the response data
      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        // If response can't be parsed as JSON, create default error
        responseData = { error: 'Failed to update grid content' };
      }
      
      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to update grid content';
        console.error('Grid update error:', errorMessage);
        
        // Show specific user-friendly error messages based on error type
        let userMessage = errorMessage;
        if (errorMessage.includes('Invalid credentials') || 
            errorMessage.includes('Invalid subscription ID') ||
            errorMessage.includes('Invalid ID format')) {
          userMessage = 'The ID you entered was not recognized. Please check and try again.';
        } else if (errorMessage.includes('Email does not match')) {
          userMessage = 'The email address does not match our records for this subscription.';
        } else if (errorMessage.includes('subscription is not active')) {
          userMessage = 'Your subscription is not active. Please renew to edit this grid.';
        } else if (errorMessage.includes('permission')) {
          userMessage = 'You do not have permission to edit this grid.';
        }
        
        throw new Error(userMessage);
      }

      // Success - close modal and refresh the page
      setIsEditModalOpen(false);
      // Refresh the page to see updated content
      window.location.reload();
    } catch (error) {
      console.error('Error updating grid:', error);
      // Show the error to the user
      alert(error instanceof Error ? error.message : 'An error occurred while updating the grid');
    }
  };

  const transformOrigin = getTransformOrigin ? getTransformOrigin() : 'center center';

  return (
    <>
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
                  loading="lazy"
                />
              )}
              
              {/* Only show title in non-hover state if no content or image is present - SMALLER SIZE */}
              {!isHovered && title && (!imageUrl || (!hasValidContent() && !description)) && (
                <div className="grid-title-legend">
                  <p className="grid-title-small">{title}</p>
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
          
          {/* Show a subtle indicator for leased grids when not hovered */}
          {isLeased && !isHovered && (
            <div className="absolute top-0 right-0 z-10 p-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          )}
          
          {/* Render hover overlay directly within the grid */}
          {isHovered && (
            <div className="absolute inset-0 z-50">
              <GridHoverOverlay
                {...{ id, status, price, imageUrl, title, description, externalUrl }}
                content={content}
                isVisible={true}
                isLoading={isLoading}
                onPurchaseClick={handleGridAction}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleEditModalSubmit}
          gridId={id}
        />
      )}
    </>
  );
};

export default GridItem; 