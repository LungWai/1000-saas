import { useState } from 'react';
import { GridContainerProps, GridProps } from '@/types';
import GridItem from './GridItem';
import { GRID_CONFIG } from '@/lib/constants';

interface ExtendedGridContainerProps extends GridContainerProps {
  onPurchaseClick: (gridId: string) => void;
}

const GridContainer: React.FC<ExtendedGridContainerProps> = ({
  grids,
  containerSize = GRID_CONFIG.TOTAL_GRIDS,
  columns = GRID_CONFIG.BREAKPOINTS.lg.columns,
  onPurchaseClick,
}) => {
  const [hoveredGrid, setHoveredGrid] = useState<string | null>(null);

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(60px, 1fr))`,
    gap: '4px',
    padding: '20px',
    maxWidth: '100vw',
  };

  return (
    <div style={gridStyles} className="grid-container">
      {Array.from({ length: containerSize }, (_, index) => {
        const grid = grids.find((g) => g.id === `grid-${index}`) || {
          id: `grid-${index}`,
          status: 'empty',
          price: 99,
        } as GridProps;

        return (
          <GridItem
            key={grid.id}
            {...grid}
            isHovered={hoveredGrid === grid.id}
            onMouseEnter={() => setHoveredGrid(grid.id)}
            onMouseLeave={() => setHoveredGrid(null)}
            onPurchaseClick={() => onPurchaseClick(grid.id)}
          />
        );
      })}
    </div>
  );
};

export default GridContainer; 