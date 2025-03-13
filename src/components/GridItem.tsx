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
  perimeterInfo?: { isPerimeter: boolean; edges: string[] };
  forceRecalculation?: number;
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
  perimeterInfo = { isPerimeter: false, edges: [] },
  forceRecalculation = 0,
}) => {
  const isEmpty = status === 'empty';
  const isLeased = status === 'leased';
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [zIndex, setZIndex] = useState(10);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // Reset states when forceRecalculation changes
  useEffect(() => {
    if (forceRecalculation > 0) {
      setIsHovered(false);
      setZIndex(10);
      
      if (gridRef.current) {
        gridRef.current.style.cssText = `
          z-index: 10;
          transform: scale(1);
          transform-origin: ${getTransformOrigin ? getTransformOrigin() : 'center center'};
          pointer-events: auto;
        `;
      }
    }
  }, [forceRecalculation, getTransformOrigin]);

  // Update z-index based on hover state and perimeter position
  useEffect(() => {
    if (isHovered) {
      // Higher z-index for perimeter grids to ensure they appear above others
      setZIndex(perimeterInfo.isPerimeter ? 120 : 100);
    } else {
      // Base z-index slightly higher for perimeter grids
      setZIndex(perimeterInfo.isPerimeter ? 15 : 10);
    }
  }, [isHovered, perimeterInfo.isPerimeter]);

  // Update image preview when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImagePreviewUrl(imageUrl);
    }
  }, [imageUrl]);

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
    // First, reset modal state
    setIsEditModalOpen(false);
    
    // Reset hover state
    setIsHovered(false);
    
    // Reset z-index
    setZIndex(perimeterInfo.isPerimeter ? 15 : 10);
    
    // Clear any pending hover timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Reset the grid's hover and z-index state
    if (gridRef.current) {
      // Force immediate style reset
      gridRef.current.style.cssText = `
        z-index: ${perimeterInfo.isPerimeter ? 15 : 10} !important;
        transform: scale(1) !important;
        transform-origin: ${getTransformOrigin ? getTransformOrigin() : 'center center'} !important;
        transition: none !important;
        pointer-events: none !important;
      `;
      
      // Remove any hover-related attributes and classes
      gridRef.current.setAttribute('data-hovered', 'false');
      gridRef.current.classList.remove('z-[100]', 'z-[120]');
      
      // Force a repaint
      void gridRef.current.offsetHeight;
      
      // Restore normal styles and interactions after a delay
      setTimeout(() => {
        if (gridRef.current) {
          gridRef.current.style.cssText = `
            z-index: ${perimeterInfo.isPerimeter ? 15 : 10};
            transform: scale(1);
            transform-origin: ${getTransformOrigin ? getTransformOrigin() : 'center center'};
            pointer-events: auto;
          `;
        }
      }, 300); // Match transition duration
    }
    
    // Notify parent that hover state has changed
    if (onHoverStateChange) {
      onHoverStateChange(id, false);
    }
    
    // Prevent any new hover effects temporarily
    document.body.classList.add('modal-closing');
    setTimeout(() => {
      document.body.classList.remove('modal-closing');
    }, 500);
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

      // Success - close modal and reset states
      setIsEditModalOpen(false);
      
      // Reset hover state
      setIsHovered(false);
      
      // Reset z-index
      setZIndex(perimeterInfo.isPerimeter ? 15 : 10);
      
      // Clear any pending hover timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      
      // Reset the grid's hover and z-index state
      if (gridRef.current) {
        // Force immediate style reset
        gridRef.current.style.cssText = `
          z-index: ${perimeterInfo.isPerimeter ? 15 : 10} !important;
          transform: scale(1) !important;
          transform-origin: ${getTransformOrigin ? getTransformOrigin() : 'center center'} !important;
          transition: none !important;
          pointer-events: none !important;
        `;
        
        // Remove any hover-related attributes and classes
        gridRef.current.setAttribute('data-hovered', 'false');
        gridRef.current.classList.remove('z-[100]', 'z-[120]');
        
        // Force a repaint
        void gridRef.current.offsetHeight;
        
        // Restore normal styles and interactions after a delay
        setTimeout(() => {
          if (gridRef.current) {
            gridRef.current.style.cssText = `
              z-index: ${perimeterInfo.isPerimeter ? 15 : 10};
              transform: scale(1);
              transform-origin: ${getTransformOrigin ? getTransformOrigin() : 'center center'};
              pointer-events: auto;
            `;
          }
        }, 300); // Match transition duration
      }
      
      // Notify parent that hover state has changed
      if (onHoverStateChange) {
        onHoverStateChange(id, false);
      }
      
      // Prevent any new hover effects temporarily
      document.body.classList.add('modal-closing');
      setTimeout(() => {
        document.body.classList.remove('modal-closing');
      }, 500);

      // Update the grid content with the response data
      const updatedGrid = responseData;
      if (updatedGrid) {
        // Update local state with new data
        if (updatedGrid.image_url) {
          imageUrl = updatedGrid.image_url;
        }
        if (updatedGrid.title) {
          title = updatedGrid.title;
        }
        if (updatedGrid.description) {
          description = updatedGrid.description;
        }
        if (updatedGrid.external_url) {
          externalUrl = updatedGrid.external_url;
        }
      }

      // Force a re-render of the component
      window.location.reload();
    } catch (error) {
      console.error('Error updating grid:', error);
      // Show the error to the user
      alert(error instanceof Error ? error.message : 'An error occurred while updating the grid');
    }
  };

  const handleClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) { // Double click threshold
      if (externalUrl) {
        window.open(externalUrl, '_blank');
      }
    }
    setLastClickTime(currentTime);
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
          ${isHovered ? (perimeterInfo.isPerimeter ? 'z-[120]' : 'z-[100]') : (perimeterInfo.isPerimeter ? 'z-[15]' : 'z-10')}
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
          transformOrigin: getTransformOrigin ? getTransformOrigin() : 'center center',
          zIndex,
          ...style,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-label={`Grid ${id}`}
        data-grid-id={id}
        data-grid-status={status}
        data-hovered={isHovered ? "true" : "false"}
        data-perimeter={perimeterInfo.isPerimeter ? "true" : "false"}
        data-edges={perimeterInfo.edges.join(' ')}
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
              {imagePreviewUrl && (
                <div className="absolute inset-0">
                  <img
                    src={imagePreviewUrl}
                    alt={title || 'Grid content'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    key={imagePreviewUrl}
                  />
                </div>
              )}
              
              {/* Only show title in non-hover state if no content or image is present - SMALLER SIZE */}
              {!isHovered && title && (!imagePreviewUrl || (!hasValidContent() && !description)) && (
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