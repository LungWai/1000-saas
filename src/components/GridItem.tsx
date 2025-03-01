import { GridProps } from '@/types';
import GridHoverOverlay from './GridHoverOverlay';
import { GRID_CONFIG } from '@/lib/constants';
import { CSSProperties } from 'react';

interface ExtendedGridProps extends GridProps {
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  style?: CSSProperties;
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
  isHovered,
  onMouseEnter,
  onMouseLeave,
  style = {},
}) => {
  const isEmpty = status === 'empty';
  
  return (
    <div
      className={`relative transition-all duration-${GRID_CONFIG.HOVER_ANIMATION_DURATION} ${
        isHovered ? `z-[100]` : 'z-10'
      }`}
      style={{
        transform: isHovered ? `scale(${GRID_CONFIG.HOVER_SCALE})` : 'scale(1)',
        transformOrigin: 'center center',
        width: GRID_CONFIG.BREAKPOINTS.lg.size,
        height: GRID_CONFIG.BREAKPOINTS.lg.size,
        ...style,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
          <div className="absolute inset-0 z-50" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <GridHoverOverlay
              price={price}
              isVisible={true}
              onPurchaseClick={() => onPurchaseClick(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GridItem; 