"use client"

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { GridContainerProps, GridProps } from '@/types';
import GridItem from './GridItem';
import { GRID_CONFIG, PRICING } from '@/lib/constants';
import PurchaseModal from './PurchaseModal';

interface ExpandedGridState {
  id: string;
  centerX: number;
  centerY: number;
  size: number;
}

interface ExtendedGridContainerProps extends GridContainerProps {
  onPurchaseClick: (gridId: string) => void;
}

const GridContainer: React.FC<ExtendedGridContainerProps> = ({
  grids,
  containerSize = GRID_CONFIG.TOTAL_GRIDS,
  columns = GRID_CONFIG.BREAKPOINTS.lg.columns,
  onPurchaseClick,
}) => {
  const [expandedGrid, setExpandedGrid] = useState<ExpandedGridState | null>(null);
  const [dynamicColumns, setDynamicColumns] = useState(columns);
  const [visibleGrids, setVisibleGrids] = useState(containerSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridPositions, setGridPositions] = useState<Map<string, { row: number, col: number }>>(new Map());
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [forceRecalculation, setForceRecalculation] = useState(0);

  // Adjust grid layout based on viewport size
  useEffect(() => {
    const calculateLayout = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate grid size based on the constants
      const gridSize = parseInt(GRID_CONFIG.BREAKPOINTS.lg.size);
      
      // Calculate how many columns and rows can fit in the viewport
      const maxColumns = Math.floor((viewportWidth - 60) / gridSize); // Add some padding
      const maxRows = Math.floor((viewportHeight - 300) / gridSize); // Subtract header/footer space
      
      // Set the dynamic columns (use a minimum to avoid too few columns)
      const optimalColumns = Math.max(4, Math.min(maxColumns, GRID_CONFIG.BREAKPOINTS.lg.columns));
      setDynamicColumns(optimalColumns);
      
      // Calculate how many grids should be visible based on available space
      // Show all grids by default, but limit to what can fit on screen if needed
      const totalGrids = containerSize;
      const visibleRows = Math.ceil(totalGrids / optimalColumns);
      
      // Ensure we display at least the first 100 grids
      setVisibleGrids(Math.max(100, totalGrids));
    };

    // Calculate on mount and when window resizes
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    
    return () => {
      window.removeEventListener('resize', calculateLayout);
    };
  }, [containerSize]);

  // Update grid positions when columns, visible grids, or force recalculation changes
  useEffect(() => {
    const newPositions = new Map<string, { row: number, col: number }>();
    
    // Sort grids by ID
    const sortedGrids = [...grids].sort((a, b) => a.id.localeCompare(b.id));
    
    for (let i = 0; i < visibleGrids; i++) {
      const gridId = i < sortedGrids.length ? sortedGrids[i].id : `grid-${i}`;
      const row = Math.floor(i / dynamicColumns);
      const col = i % dynamicColumns;
      newPositions.set(gridId, { row, col });
    }
    
    setGridPositions(newPositions);
  }, [dynamicColumns, visibleGrids, grids, forceRecalculation]);

  // Enhanced isPerimeterGrid function with memoization
  const getPerimeterInfo = (gridId: string) => {
    const position = gridPositions.get(gridId);
    if (!position) return { isPerimeter: false, edges: [] };
    
    const { row, col } = position;
    const maxRow = Math.floor((visibleGrids - 1) / dynamicColumns);
    
    const edges = [];
    if (row === 0) edges.push('top');
    if (row === maxRow) edges.push('bottom');
    if (col === 0) edges.push('left');
    if (col === dynamicColumns - 1) edges.push('right');
    
    return {
      isPerimeter: edges.length > 0,
      edges
    };
  };

  // Adjust hover direction for perimeter grids
  const getHoverDirection = (gridId: string) => {
    const position = gridPositions.get(gridId);
    if (!position) return 'center';
    
    const { row, col } = position;
    const maxRow = Math.floor((visibleGrids - 1) / dynamicColumns);
    
    // Determine which edge(s) the grid is on
    const isTop = row === 0;
    const isBottom = row === maxRow;
    const isLeft = col === 0;
    const isRight = col === dynamicColumns - 1;
    
    // Return direction to push the hover effect
    if (isTop && isLeft) return 'bottom-right';
    if (isTop && isRight) return 'bottom-left';
    if (isBottom && isLeft) return 'top-right';
    if (isBottom && isRight) return 'top-left';
    if (isTop) return 'bottom';
    if (isBottom) return 'top';
    if (isLeft) return 'right';
    if (isRight) return 'left';
    
    return 'center';
  };

  const isWithinExpandedArea = (mouseX: number, mouseY: number): boolean => {
    if (!expandedGrid) return true; // If no expanded grid, allow hover

    const dx = mouseX - expandedGrid.centerX;
    const dy = mouseY - expandedGrid.centerY;
    const radius = expandedGrid.size / 2 * 1.2;

    // Check if point is within the expanded square area
    return Math.abs(dx) <= radius && Math.abs(dy) <= radius;
  };

  useEffect(() => {
    if (!expandedGrid) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isWithinExpandedArea(e.clientX, e.clientY)) {
        setExpandedGrid(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [expandedGrid]);

  // New function to handle hover state changes from GridItems
  const handleGridHoverStateChange = (gridId: string, isHovered: boolean, element?: HTMLElement) => {
    if (isHovered && element) {
      // Only update expandedGrid state when a grid becomes hovered
      const rect = element.getBoundingClientRect();
      const size = rect.width * GRID_CONFIG.HOVER_SCALE;
      
      setExpandedGrid({
        id: gridId,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        size: size,
      });
    } else if (!isHovered && expandedGrid?.id === gridId) {
      // Only clear expandedGrid if the grid that's no longer hovered is the currently expanded one
      setExpandedGrid(null);
    }
  };

  const handleGridPurchaseClick = (gridId: string) => {
    // Clear expanded grid and prevent new expansions
    setExpandedGrid(null);
    document.body.classList.add('modal-open');
    
    // Call the parent's onPurchaseClick to show the toast notification
    onPurchaseClick(gridId);
    
    // Set the selected grid ID but don't show the modal yet
    setSelectedGridId(gridId);
    
    // Show the purchase modal after a delay to ensure smooth transition
    setTimeout(() => {
      setIsPurchaseModalOpen(true);
    }, 300);
  };

  const handleModalClose = () => {
    setIsPurchaseModalOpen(false);
    setSelectedGridId(null);
    setIsLoading(null);
    
    // Remove modal open class and add closing class temporarily
    document.body.classList.remove('modal-open');
    document.body.classList.add('modal-closing');
    
    // Clear expanded grid state
    setExpandedGrid(null);
    
    // Force recalculation of grid positions and perimeter status
    setForceRecalculation(prev => prev + 1);
    
    // Remove closing class after transition
    setTimeout(() => {
      document.body.classList.remove('modal-closing');
    }, 500);
  };

  const getTransformOriginForGrid = (gridId: string) => {
    const direction = getHoverDirection(gridId);
    
    switch (direction) {
      case 'top-left': return 'bottom right';
      case 'top-right': return 'bottom left';
      case 'bottom-left': return 'top right';
      case 'bottom-right': return 'top left';
      case 'top': return 'bottom center';
      case 'bottom': return 'top center';
      case 'left': return 'center right';
      case 'right': return 'center left';
      default: return 'center';
    }
  };

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(${dynamicColumns}, ${GRID_CONFIG.BREAKPOINTS.lg.size})`,
    gap: '1px',
    padding: '10px',
    maxWidth: '100%',
    justifyContent: 'center',
    position: 'relative' as const,
    margin: '0 auto',
  };

  return (
    <div ref={containerRef} className="w-full">
      {isPurchaseModalOpen && selectedGridId && (
        <PurchaseModal
          gridId={selectedGridId}
          onClose={handleModalClose}
          price={grids?.find(grid => grid.id === selectedGridId)?.price || PRICING.BASE_PRICE}
          gridTitle={grids?.find(grid => grid.id === selectedGridId)?.title}
        />
      )}
      
      <div 
        className="grid gap-0.8 w-full mx-1 md:mx-2"
        style={{
          gridTemplateColumns: `repeat(${dynamicColumns}, minmax(0, 1fr))`,
        }}
      >
        {grids?.map((grid, index) => (
          index < visibleGrids && (
            <GridItem
              key={grid.id}
              id={grid.id}
              status={grid.status}
              price={grid.price}
              imageUrl={grid.imageUrl}
              title={grid.title}
              description={grid.description}
              externalUrl={grid.externalUrl}
              content={grid.content}
              onPurchaseClick={() => handleGridPurchaseClick(grid.id)}
              isLoading={isLoading}
              getTransformOrigin={() => getTransformOriginForGrid(grid.id)}
              onHoverStateChange={handleGridHoverStateChange}
              perimeterInfo={getPerimeterInfo(grid.id)}
              forceRecalculation={forceRecalculation}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default GridContainer; 