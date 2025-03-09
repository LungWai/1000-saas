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
  
  // Handle JSON content if it's a string
  const parseContent = (contentData: string | null | undefined) => {
    if (!contentData) return '';
    try {
      // If content is JSON, pretty print it
      const parsed = JSON.parse(contentData);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If not JSON, just return the string
      return contentData;
    }
  };
  
  const displayContent = parseContent(content);
  const hasDisplayableContent = !!displayContent || !!description;
  
  return (
    <>
      {/* Status badge */}
      <div className="absolute top-0 right-0 z-50 p-0.5 flex justify-end pointer-events-none">
        <div className={`text-[0.16rem] px-0.5 py-0.5 rounded-sm ${
          isDarkMode ? 'bg-black/70 text-white' : 'bg-white/70 text-black'
        }`}>
          {status}
        </div>
      </div>
      
      {/* Content Display for Leased Grids */}
      {isLeased && (
        <div className="grid-content-container content-fade-in">
          {/* Description */}
          {description && (
            <div className={`grid-content-title ${
              isDarkMode ? 'bg-black/70 text-white' : 'bg-white/70 text-black'
            }`}>
              {truncateText(description, 30)}
            </div>
          )}
          
          {/* Content */}
          {displayContent && (
            <div className={`grid-content-text grid-hover-content ${
              isDarkMode ? 'bg-black/60 text-white' : 'bg-white/60 text-black'
            }`}>
              {truncateText(displayContent, 50)}
            </div>
          )}
          
          {/* Show placeholder if no content or description */}
          {!hasDisplayableContent && (
            <div className={`grid-content-text ${
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
          <div className="flex items-baseline">
            <span className="text-[0.28rem] font-medium">
              ${price}
            </span>
            <span className="text-[0.22rem] ml-px">
              /month
            </span>
          </div>
        )}
        
        {/* Action Button */}
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          className={`text-[0.22rem] py-px rounded-sm h-[0.28rem] flex items-center justify-center cursor-pointer border-none font-semibold text-white
            ${isLeased ? 'bg-green-500 hover:bg-green-600 px-2 ml-auto' : 'bg-blue-500 hover:bg-blue-600 px-1 ml-1'}`}
          style={{ minWidth: isLeased ? '0.8rem' : '1rem' }}
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