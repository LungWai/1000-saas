"use client"

import type React from 'react';
import { useState, useRef, KeyboardEvent } from 'react';
import { Grid as GridType } from '@/types';
import PurchaseModal from './PurchaseModal';
import { PRICING } from '@/lib/constants';

interface GridProps {
  grid: GridType;
  onClick?: () => void;
  tabIndex?: number;
  onKeyboardNavigation?: (direction: 'up' | 'down' | 'left' | 'right', gridId: string) => void;
}

export default function Grid({ grid, onClick, tabIndex = 0, onKeyboardNavigation }: GridProps) {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleGridClick = () => {
    if (!grid.content && !grid.customerId) {
      setIsPurchaseModalOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGridClick();
    }
    
    if (onKeyboardNavigation) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onKeyboardNavigation('up', grid.id);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onKeyboardNavigation('down', grid.id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onKeyboardNavigation('left', grid.id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onKeyboardNavigation('right', grid.id);
      }
    }
  };

  const handleCheckout = () => {
    console.log("Grid component: Checkout initiated for grid:", grid.id);
    // You could add additional checkout handling here if needed
  };

  return (
    <>
      <div
        ref={gridRef}
        onClick={handleGridClick}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        role="button"
        aria-label={grid.content ? `Grid with content: ${grid.title || ''}` : `Available grid: ${grid.title || ''}`}
        className={`
          w-full aspect-square border border-gray-200 rounded-lg p-4
          ${!grid.content && !grid.customerId ? 'cursor-pointer hover:border-indigo-500' : ''}
          ${grid.content ? 'bg-white' : 'bg-gray-50'}
          focus:outline-none focus:ring-2 focus:ring-indigo-500
        `}
      >
        {grid.content ? (
          <div className="w-full h-full flex items-center justify-center">
            {grid.content}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {grid.customerId ? 'Reserved' : 'Available'}
          </div>
        )}
      </div>

      {isPurchaseModalOpen && (
        <PurchaseModal
          gridId={grid.id}
          price={grid.price || PRICING.BASE_PRICE}
          onClose={() => setIsPurchaseModalOpen(false)}
          onCheckout={handleCheckout}
          gridTitle={grid.title}
        />
      )}
    </>
  );
} 