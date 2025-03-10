"use client"

import type React from 'react';
import { MouseEvent, useEffect, useState } from 'react';
import { GridHoverOverlayProps, GridProps } from '@/types';
import { useTheme } from '@/lib/ThemeProvider';

interface ExtendedGridHoverOverlayProps extends GridHoverOverlayProps, GridProps {
  isLoading?: boolean;
  content?: string | null;
}

const GridHoverOverlay: React.FC<ExtendedGridHoverOverlayProps> = ({
  id,
  status,
  price,
  imageUrl,
  title,
  description,
  externalUrl,
  content,
  isVisible,
  isLoading = false,
  onPurchaseClick,
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLeased = status === 'leased';
  
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
  
  // Function to truncate text if too long
  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Safely check if content is displayable, returns empty string for invalid content
  const isValidContent = (contentData: any): boolean => {
    if (!contentData) return false;
    
    // If it's an empty object
    if (typeof contentData === 'object' && Object.keys(contentData).length === 0) {
      return false;
    }
    
    // If it's a string representation of an empty object "{}"
    if (contentData === '{}') return false;
    
    return true;
  };
  
  // Parse content safely
  const getDisplayContent = (contentData: string | null | undefined): string => {
    if (!isValidContent(contentData)) return '';
    
    // If it's already a string, just return it
    if (typeof contentData === 'string') {
      try {
        // Check if it's valid JSON
        const parsed = JSON.parse(contentData);
        if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
          return '';
        }
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Not valid JSON, just return the string
        return contentData;
      }
    }
    
    // Fallback - try to stringify if it's an object
    try {
      return JSON.stringify(contentData, null, 2);
    } catch (e) {
      return '';
    }
  };
  
  const displayContent = getDisplayContent(content);
  const hasDisplayableContent = !!description;
  
  return (
    <>
      {/* Status badge - Changed to show "leased" in green */}
      <div className="absolute top-0 right-0 z-50 p-0.5 flex justify-end pointer-events-none">
        <div className={`text-[0.16rem] px-0.5 py-0.5 rounded-sm ${
          isLeased 
            ? 'bg-green-500 text-white' 
            : isDarkMode ? 'bg-black/70 text-white' : 'bg-white/70 text-black'
        }`}>
          {status}
        </div>
      </div>
      
      {/* Content Display for Leased Grids - Moved to bottom */}
      {isLeased && (
        <div className="absolute bottom-[0.4rem] left-0 right-0 w-full px-2 content-fade-in pointer-events-none">
          {/* Description - Moved to bottom */}
          {description && (
            <div className={`w-full text-center mb-2 py-1 px-2 rounded-sm ${
              isDarkMode ? 'bg-black/70 text-white' : 'bg-white/70 text-black'
            }`}>
              {/* Optimize title size: larger for shorter titles (4-5 words) */}
              <div className="grid-text-title">
                {truncateText(title, 40)}
              </div>
              
              {/* Optimize description size: smaller for longer text */}
              <div className="grid-text-description">
                {truncateText(description, 60)}
              </div>
            </div>
          )}
          
          {/* Content - only displayed if valid and not empty */}
          {displayContent && (
            <div className={`text-[0.16rem] p-1 rounded-sm max-w-full overflow-hidden ${
              isDarkMode ? 'bg-black/60 text-white' : 'bg-white/60 text-black'
            }`}>
              {truncateText(displayContent, 80)}
            </div>
          )}
          
          {/* Show placeholder if no content or description */}
          {!hasDisplayableContent && !displayContent && (
            <div className={`text-center py-1 px-2 text-[0.18rem] rounded-sm ${
              isDarkMode ? 'bg-black/50 text-gray-300' : 'bg-white/50 text-gray-600'
            }`}>
              Add content by clicking "Edit"
            </div>
          )}
        </div>
      )}
      
      {/* Custom bottom bar to avoid CSS conflicts */}
      <div className={`custom-grid-hover ${
        isDarkMode ? 'bg-black/70' : 'bg-white/80'
      }`} style={{ height: isLeased ? '0.35rem' : '0.4rem' }}>
        {/* Price - only for non-leased grids */}
        {!isLeased && (
          <div className="flex items-baseline mr-auto">
            <span className="text-[0.28rem] font-medium">
              ${price}
            </span>
            <span className="text-[0.22rem] ml-px">
              /month
            </span>
          </div>
        )}
        
        {/* Action Button - moved further to the right corner */}
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          className={`text-[0.22rem] py-px rounded-sm h-[0.28rem] flex items-center justify-center cursor-pointer border-none font-semibold text-white
            ${isLeased 
              ? 'bg-green-500 hover:bg-green-600 px-2 mr-0.5' 
              : 'bg-blue-500 hover:bg-blue-600 px-1 mr-0.5'}`}
          style={{ 
            minWidth: isLeased ? '0.8rem' : '1rem',
            position: 'relative',
            right: '0.1rem'
          }}
        >
          {isLoading ? (
            <div className="text-[0.22rem] flex items-center">
              <div className="w-[0.15rem] h-[0.15rem] rounded-full border-t border-current animate-spin"></div>
              <span className="ml-1">...</span>
            </div>
          ) : (
            <span>
              {isLeased ? 'Edit' : 'Lease'}
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default GridHoverOverlay; 